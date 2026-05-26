"""
KCSE Management System - Serializers
"""

from rest_framework import serializers
from .models import (
    Candidate, Subject, SubjectResult, OverallResult,
    School, ExaminationYear, GradingScale, County, SubCounty,
    CandidateSubject, ResultQuery, AuditLog
)


# ─────────────────────────────────────────────
# LOOKUP SERIALIZERS
# ─────────────────────────────────────────────

class CountySerializer(serializers.ModelSerializer):
    class Meta:
        model = County
        fields = ['id', 'name', 'code']


class SubCountySerializer(serializers.ModelSerializer):
    county = CountySerializer(read_only=True)

    class Meta:
        model = SubCounty
        fields = ['id', 'name', 'code', 'county']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'code', 'name', 'subject_type', 'max_score', 'has_practical']


class GradingScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScale
        fields = ['grade', 'points', 'min_score', 'max_score']


class ExaminationYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExaminationYear
        fields = [
            'id', 'year', 'status', 'registration_deadline',
            'exam_start_date', 'exam_end_date', 'results_release_date',
            'is_results_released'
        ]


class SchoolSerializer(serializers.ModelSerializer):
    sub_county = SubCountySerializer(read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'center_code', 'name', 'school_type', 'category',
            'sub_county', 'email', 'phone', 'principal_name'
        ]


# ─────────────────────────────────────────────
# RESULT SERIALIZERS (public-facing)
# ─────────────────────────────────────────────

class SubjectResultSerializer(serializers.ModelSerializer):
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_type = serializers.CharField(source='subject.subject_type', read_only=True)
    grade_letter = serializers.CharField(source='grade.grade', read_only=True)
    grade_points = serializers.IntegerField(source='grade.points', read_only=True)

    class Meta:
        model = SubjectResult
        fields = [
            'subject_code', 'subject_name', 'subject_type',
            'final_score', 'grade_letter', 'grade_points', 'status'
        ]


class OverallResultSerializer(serializers.ModelSerializer):
    mean_grade_letter = serializers.CharField(source='mean_grade.grade', read_only=True)
    mean_grade_points = serializers.IntegerField(source='mean_grade.points', read_only=True)

    class Meta:
        model = OverallResult
        fields = [
            'total_points', 'mean_grade_letter', 'mean_grade_points',
            'mean_score', 'subjects_sat', 'subjects_counted',
            'school_rank', 'sub_county_rank', 'county_rank', 'national_rank',
            'status', 'remarks'
        ]


class CandidateResultSerializer(serializers.ModelSerializer):
    """Public result slip – returned when a candidate queries their results"""
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_center_code = serializers.CharField(source='school.center_code', read_only=True)
    county = serializers.SerializerMethodField()
    sub_county = serializers.SerializerMethodField()
    examination_year_value = serializers.IntegerField(source='examination_year.year', read_only=True)
    subject_results = SubjectResultSerializer(many=True, read_only=True)
    overall_result = OverallResultSerializer(read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'index_number', 'full_name', 'gender_display',
            'school_name', 'school_center_code', 'county', 'sub_county',
            'examination_year_value',
            'subject_results', 'overall_result',
        ]

    def get_county(self, obj):
        try:
            return obj.school.sub_county.county.name
        except AttributeError:
            return None

    def get_sub_county(self, obj):
        try:
            return obj.school.sub_county.name
        except AttributeError:
            return None


# ─────────────────────────────────────────────
# RESULT QUERY SERIALIZER
# ─────────────────────────────────────────────

class ResultQueryInputSerializer(serializers.Serializer):
    """Input validation for public result lookup"""
    index_number = serializers.CharField(
        max_length=14,
        min_length=14,
        help_text='14-digit KNEC index number'
    )
    full_name = serializers.CharField(
        max_length=200,
        help_text='Full name as registered with KNEC'
    )
    examination_year = serializers.IntegerField(
        required=False,
        help_text='Examination year (optional; defaults to latest released year)'
    )

    def validate_index_number(self, value):
        value = value.strip().replace(' ', '')
        if not value.isdigit():
            raise serializers.ValidationError('Index number must contain digits only.')
        if len(value) != 14:
            raise serializers.ValidationError(
                'Index number must be exactly 14 digits (11-digit center code + 3-digit student number).'
            )
        return value

    def validate_full_name(self, value):
        value = value.strip().upper()
        parts = value.split()
        if len(parts) < 2:
            raise serializers.ValidationError('Please enter at least two names.')
        return value


# ─────────────────────────────────────────────
# ADMIN / REGISTRATION SERIALIZERS
# ─────────────────────────────────────────────

class CandidateRegistrationSerializer(serializers.ModelSerializer):
    """Used by school administrators to register candidates"""
    subject_codes = serializers.ListField(
        child=serializers.CharField(), write_only=True,
        help_text='List of subject codes to register the candidate for'
    )

    class Meta:
        model = Candidate
        fields = [
            'index_number', 'kcpe_index_number', 'birth_certificate_number',
            'full_name', 'first_name', 'middle_name', 'last_name',
            'gender', 'date_of_birth', 'nationality',
            'school', 'examination_year',
            'has_special_needs', 'special_needs_details',
            'subject_codes'
        ]

    def validate_index_number(self, value):
        if not value.isdigit() or len(value) != 14:
            raise serializers.ValidationError('Must be exactly 14 digits.')
        return value

    def validate(self, data):
        # Validate no duplicate KCPE index for same exam year
        kcpe = data.get('kcpe_index_number')
        year = data.get('examination_year')
        if Candidate.objects.filter(kcpe_index_number=kcpe, examination_year=year).exists():
            raise serializers.ValidationError(
                {'kcpe_index_number': 'A candidate with this KCPE index is already registered for this year.'}
            )
        return data

    def create(self, validated_data):
        subject_codes = validated_data.pop('subject_codes', [])
        candidate = Candidate.objects.create(**validated_data)

        if subject_codes:
            subjects = Subject.objects.filter(code__in=subject_codes, is_active=True)
            for subject in subjects:
                CandidateSubject.objects.create(candidate=candidate, subject=subject)

        return candidate


class SubjectResultEntrySerializer(serializers.ModelSerializer):
    """Used by examiners to enter marks"""
    class Meta:
        model = SubjectResult
        fields = [
            'id', 'candidate', 'subject', 'examination_year',
            'paper1_score', 'paper2_score', 'paper3_score', 'practical_score',
            'raw_score', 'status'
        ]
        read_only_fields = ['id', 'raw_score']

    def validate(self, data):
        subject = data.get('subject')
        paper1 = data.get('paper1_score')
        paper2 = data.get('paper2_score')
        paper3 = data.get('paper3_score')
        practical = data.get('practical_score')

        # Check score ranges
        for field_name, score in [
            ('paper1_score', paper1), ('paper2_score', paper2),
            ('paper3_score', paper3), ('practical_score', practical)
        ]:
            if score is not None and (score < 0 or score > subject.max_score):
                raise serializers.ValidationError(
                    {field_name: f'Score must be between 0 and {subject.max_score}.'}
                )

        return data


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'actor', 'ip_address', 'index_number', 'description', 'timestamp']