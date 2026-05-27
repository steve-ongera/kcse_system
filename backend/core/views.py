"""
KCSE Management System - Views
"""

from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import (
    Candidate, SubjectResult, OverallResult,
    ExaminationYear, School, Subject, GradingScale,
    AuditLog, ResultQuery
)
from .serializers import (
    CandidateResultSerializer, ResultQueryInputSerializer,
    CandidateRegistrationSerializer, SubjectResultEntrySerializer,
    SchoolSerializer, SubjectSerializer, ExaminationYearSerializer,
    GradingScaleSerializer, AuditLogSerializer
)


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_action(action, description, request=None, index_number='', extra_data=None):
    AuditLog.objects.create(
        action=action,
        actor=str(request.user) if request and request.user.is_authenticated else 'anonymous',
        ip_address=get_client_ip(request) if request else None,
        index_number=index_number,
        description=description,
        extra_data=extra_data or {}
    )


def normalize_name(name: str) -> str:
    """Normalize name for fuzzy comparison"""
    return ' '.join(name.strip().upper().split())


def names_match(registered: str, provided: str, threshold: int = 2) -> bool:
    """
    Check if candidate name matches the provided name.
    Allows partial matches across at least `threshold` name tokens.
    This accommodates reordering of names.
    """
    reg_parts = set(normalize_name(registered).split())
    prov_parts = set(normalize_name(provided).split())
    common = reg_parts & prov_parts
    return len(common) >= threshold


# ─────────────────────────────────────────────
# PUBLIC: RESULT LOOKUP (No Login Required)
# ─────────────────────────────────────────────

class ResultQueryThrottle(AnonRateThrottle):
    rate = '20/hour'

class ResultLookupView(APIView):
    """
    PUBLIC endpoint – no authentication required.
    Candidate enters their index number + full name to retrieve results.

    POST /api/results/lookup/
    Body: { index_number, full_name, examination_year (optional) }
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResultQueryThrottle]

    def get(self, request):
        """Handle GET requests - returns API documentation"""
        return Response({
            'message': 'This endpoint accepts POST requests only',
            'instructions': {
                'method': 'POST',
                'content_type': 'application/json',
                'required_fields': ['index_number', 'full_name'],
                'optional_fields': ['examination_year'],
                'example_request': {
                    'index_number': '12345678901001',
                    'full_name': 'JOHN DOE',
                    'examination_year': 2024
                }
            }
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ResultQueryInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        index_number = serializer.validated_data['index_number']
        full_name = serializer.validated_data['full_name']
        exam_year = serializer.validated_data.get('examination_year')
        ip = get_client_ip(request)

        # Resolve examination year
        if exam_year:
            try:
                year_obj = ExaminationYear.objects.get(year=exam_year, status='RESULTS_RELEASED')
            except ExaminationYear.DoesNotExist:
                return Response(
                    {'success': False, 'message': f'Results for {exam_year} have not been released yet.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            year_obj = (
                ExaminationYear.objects
                .filter(status='RESULTS_RELEASED')
                .order_by('-year')
                .first()
            )
            if not year_obj:
                return Response(
                    {'success': False, 'message': 'No results have been released yet.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Look up candidate
        try:
            candidate = Candidate.objects.select_related(
                'school', 'school__sub_county', 'school__sub_county__county',
                'examination_year', 'overall_result__mean_grade'
            ).prefetch_related(
                'subject_results__subject',
                'subject_results__grade'
            ).get(
                index_number=index_number,
                examination_year=year_obj
            )
        except Candidate.DoesNotExist:
            ResultQuery.objects.create(
                index_number=index_number,
                full_name_provided=full_name,
                ip_address=ip,
                was_found=False,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            return Response(
                {'success': False, 'message': 'No candidate found with that index number.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify name
        if not names_match(candidate.full_name, full_name, threshold=2):
            ResultQuery.objects.create(
                index_number=index_number,
                full_name_provided=full_name,
                ip_address=ip,
                was_found=False,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            log_action(
                'RESULT_QUERY',
                f'Name mismatch for index {index_number}: provided "{full_name}"',
                request=request,
                index_number=index_number
            )
            return Response(
                {
                    'success': False,
                    'message': (
                        'The name provided does not match our records. '
                        'Please enter your full name exactly as registered with KNEC.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Check result status
        try:
            overall = candidate.overall_result
            if overall.status in ('WITHHELD', 'CANCELLED'):
                ResultQuery.objects.create(
                    index_number=index_number,
                    full_name_provided=full_name,
                    ip_address=ip,
                    was_found=True,
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                return Response(
                    {
                        'success': False,
                        'message': (
                            'Your results have been withheld. '
                            'Please contact KNEC or your school for further assistance.'
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        except OverallResult.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Results for this candidate are not yet available.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # All checks passed – return result
        ResultQuery.objects.create(
            index_number=index_number,
            full_name_provided=full_name,
            ip_address=ip,
            was_found=True,
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        log_action(
            'RESULT_VIEW',
            f'Result viewed for {candidate.full_name} ({index_number})',
            request=request,
            index_number=index_number
        )

        result_data = CandidateResultSerializer(candidate).data
        return Response({'success': True, 'result': result_data}, status=status.HTTP_200_OK)

# ─────────────────────────────────────────────
# PUBLIC: REFERENCE DATA
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@cache_page(60 * 60)  # Cache 1 hour
def active_examination_years(request):
    """Return years with released results for the front-end dropdown"""
    years = ExaminationYear.objects.filter(status='RESULTS_RELEASED').order_by('-year')
    return Response(ExaminationYearSerializer(years, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@cache_page(60 * 60)
def grading_scale(request):
    scales = GradingScale.objects.all()
    return Response(GradingScaleSerializer(scales, many=True).data)


# ─────────────────────────────────────────────
# ADMIN: CANDIDATE REGISTRATION
# ─────────────────────────────────────────────

class CandidateRegistrationView(generics.CreateAPIView):
    """School admin endpoint to register a new candidate"""
    queryset = Candidate.objects.all()
    serializer_class = CandidateRegistrationSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        candidate = serializer.save()
        log_action(
            'REGISTRATION_CREATE',
            f'Candidate {candidate.full_name} ({candidate.index_number}) registered',
            request=self.request,
            index_number=candidate.index_number
        )


class CandidateDetailView(generics.RetrieveUpdateAPIView):
    queryset = Candidate.objects.select_related('school', 'examination_year')
    serializer_class = CandidateRegistrationSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'index_number'


class CandidateListView(generics.ListAPIView):
    serializer_class = CandidateRegistrationSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Candidate.objects.select_related('school', 'examination_year')
        school = self.request.query_params.get('school')
        year = self.request.query_params.get('year')
        name = self.request.query_params.get('name')
        if school:
            qs = qs.filter(school__center_code=school)
        if year:
            qs = qs.filter(examination_year__year=year)
        if name:
            qs = qs.filter(full_name__icontains=name)
        return qs


# ─────────────────────────────────────────────
# ADMIN: MARKS ENTRY
# ─────────────────────────────────────────────

class SubjectResultEntryView(generics.CreateAPIView):
    queryset = SubjectResult.objects.all()
    serializer_class = SubjectResultEntrySerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        result = serializer.save(entered_by=str(self.request.user), entered_at=timezone.now())
        log_action(
            'MARKS_ENTRY',
            f'Marks entered for {result.candidate.full_name} in {result.subject.name}',
            request=self.request,
            index_number=result.candidate.index_number
        )


class SubjectResultApproveView(APIView):
    """Approve (lock) marks for a subject result"""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            result = SubjectResult.objects.get(pk=pk)
        except SubjectResult.DoesNotExist:
            return Response({'message': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if result.status not in ('ENTERED', 'VALIDATED', 'MODERATED'):
            return Response(
                {'message': f'Cannot approve result with status: {result.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result.status = 'APPROVED'
        result.approved_by = str(request.user)
        result.approved_at = timezone.now()
        result.save(update_fields=['status', 'approved_by', 'approved_at'])

        log_action(
            'MARKS_APPROVAL',
            f'Marks approved for {result.candidate.full_name} in {result.subject.name}',
            request=request,
            index_number=result.candidate.index_number
        )
        return Response({'message': 'Marks approved successfully.'}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
# ADMIN: SCHOOL PERFORMANCE ANALYTICS
# ─────────────────────────────────────────────

class SchoolPerformanceView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, center_code):
        year = request.query_params.get('year')
        qs = OverallResult.objects.filter(
            candidate__school__center_code=center_code,
            status='FINAL'
        )
        if year:
            qs = qs.filter(examination_year__year=year)

        agg = qs.aggregate(
            total_candidates=Count('id'),
            mean_total_points=Avg('total_points'),
            mean_score=Avg('mean_score'),
        )

        grade_dist = (
            qs.values('mean_grade__grade')
            .annotate(count=Count('id'))
            .order_by('-mean_grade__points')
        )

        return Response({
            'center_code': center_code,
            'year': year,
            'summary': agg,
            'grade_distribution': list(grade_dist)
        })


# ─────────────────────────────────────────────
# ADMIN: AUDIT LOGS
# ─────────────────────────────────────────────

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = AuditLog.objects.all()
        action = self.request.query_params.get('action')
        index = self.request.query_params.get('index_number')
        if action:
            qs = qs.filter(action=action)
        if index:
            qs = qs.filter(index_number=index)
        return qs.order_by('-timestamp')[:500]