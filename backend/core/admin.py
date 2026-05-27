"""
KCSE Management System - Admin Configuration
"""
from django.utils import timezone
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Avg
from . import models


# ─────────────────────────────────────────────
# INLINE CLASSES
# ─────────────────────────────────────────────

class SubCountyInline(admin.TabularInline):
    model = models.SubCounty
    extra = 1
    fields = ['name', 'code']


class CandidateSubjectInline(admin.TabularInline):
    model = models.CandidateSubject
    extra = 1
    fields = ['subject', 'is_active']
    autocomplete_fields = ['subject']


class SubjectResultInline(admin.TabularInline):
    model = models.SubjectResult
    extra = 0
    fields = [
        'subject', 'paper1_score', 'paper2_score', 'paper3_score',
        'practical_score', 'final_score', 'grade', 'status'
    ]
    autocomplete_fields = ['subject', 'grade']
    show_change_link = True


# ─────────────────────────────────────────────
# MODEL ADMIN CLASSES
# ─────────────────────────────────────────────

@admin.register(models.County)
class CountyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'sub_county_count']
    search_fields = ['name', 'code']
    inlines = [SubCountyInline]
    
    def sub_county_count(self, obj):
        return obj.sub_counties.count()
    sub_county_count.short_description = 'Sub Counties'


@admin.register(models.SubCounty)
class SubCountyAdmin(admin.ModelAdmin):
    list_display = ['name', 'county', 'code', 'school_count']
    list_filter = ['county']
    search_fields = ['name', 'code', 'county__name']
    autocomplete_fields = ['county']
    
    def school_count(self, obj):
        return obj.schools.count()
    school_count.short_description = 'Schools'


@admin.register(models.Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'subject_type', 'max_score', 'has_practical', 'is_active']
    list_filter = ['subject_type', 'has_practical', 'is_active']
    search_fields = ['code', 'name']
    list_editable = ['is_active']
    fieldsets = (
        ('Subject Information', {
            'fields': ('code', 'name', 'subject_type')
        }),
        ('Grading Configuration', {
            'fields': ('max_score', 'has_practical')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(models.GradingScale)
class GradingScaleAdmin(admin.ModelAdmin):
    list_display = ['grade', 'points', 'min_score', 'max_score']
    list_editable = ['points', 'min_score', 'max_score']
    search_fields = ['grade']


@admin.register(models.School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'center_code', 'school_type', 'category', 
        'sub_county', 'is_active', 'candidate_count'
    ]
    list_filter = ['school_type', 'category', 'sub_county__county', 'is_active']
    search_fields = ['name', 'center_code', 'email', 'phone']
    autocomplete_fields = ['sub_county']
    list_editable = ['is_active']
    
    def candidate_count(self, obj):
        return obj.candidates.count()
    candidate_count.short_description = 'Candidates'


@admin.register(models.ExaminationYear)
class ExaminationYearAdmin(admin.ModelAdmin):
    list_display = ['year', 'status', 'registration_deadline', 'candidate_count', 'result_release_status']
    list_filter = ['status']
    search_fields = ['year']
    list_editable = ['status']
    
    def candidate_count(self, obj):
        return obj.candidates.count()
    candidate_count.short_description = 'Registered Candidates'
    
    def result_release_status(self, obj):
        if obj.results_release_date:
            return format_html('✅ Released on {}', obj.results_release_date.strftime('%Y-%m-%d'))
        return '⏳ Not Released'
    result_release_status.short_description = 'Results Status'


@admin.register(models.Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = [
        'index_number', 'full_name', 'school', 'examination_year', 
        'registration_status', 'has_special_needs', 'result_link'
    ]
    list_filter = ['registration_status', 'gender', 'has_special_needs', 'school', 'examination_year']
    search_fields = ['index_number', 'full_name', 'first_name', 'last_name', 'kcpe_index_number']
    autocomplete_fields = ['school']
    readonly_fields = ['created_at', 'updated_at', 'center_code', 'student_number']
    inlines = [CandidateSubjectInline, SubjectResultInline]
    fieldsets = (
        ('Identification', {
            'fields': ('index_number', 'kcpe_index_number', 'birth_certificate_number', 'passport_photo')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'middle_name', 'last_name', 'full_name', 'gender', 'date_of_birth', 'nationality')
        }),
        ('School & Examination', {
            'fields': ('school', 'examination_year')
        }),
        ('Special Needs', {
            'fields': ('has_special_needs', 'special_needs_details')
        }),
        ('Registration Status', {
            'fields': ('registration_status', 'rejection_reason')
        }),
        ('System Info', {
            'fields': ('created_at', 'updated_at', 'center_code', 'student_number'),
            'classes': ('collapse',)
        }),
    )
    
    def result_link(self, obj):
        if hasattr(obj, 'overall_result'):
            url = reverse('admin:core_overallresult_change', args=[obj.overall_result.id])
            return format_html('<a href="{}">View Results</a>', url)
        return 'No Results Yet'
    result_link.short_description = 'Overall Result'
    
    actions = ['verify_selected_candidates', 'reject_selected_candidates']
    
    def verify_selected_candidates(self, request, queryset):
        updated = queryset.update(registration_status='KNEC_VERIFIED')
        self.message_user(request, f'{updated} candidates verified successfully.')
    verify_selected_candidates.short_description = 'Verify selected candidates'
    
    def reject_selected_candidates(self, request, queryset):
        queryset.update(registration_status='REJECTED')
        self.message_user(request, 'Selected candidates rejected.')
    reject_selected_candidates.short_description = 'Reject selected candidates'


@admin.register(models.CandidateSubject)
class CandidateSubjectAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'subject', 'is_active', 'registered_at']
    list_filter = ['is_active', 'subject']
    search_fields = ['candidate__index_number', 'candidate__full_name', 'subject__name']
    autocomplete_fields = ['candidate', 'subject']
    list_editable = ['is_active']


@admin.register(models.SubjectResult)
class SubjectResultAdmin(admin.ModelAdmin):
    list_display = [
        'candidate', 'subject', 'final_score', 'grade', 
        'status', 'examination_year', 'entered_by'
    ]
    list_filter = ['status', 'grade', 'examination_year', 'subject']
    search_fields = ['candidate__index_number', 'candidate__full_name', 'subject__name']
    autocomplete_fields = ['candidate', 'subject', 'grade']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Result Information', {
            'fields': ('candidate', 'subject', 'examination_year')
        }),
        ('Paper Scores', {
            'fields': ('paper1_score', 'paper2_score', 'paper3_score', 'practical_score')
        }),
        ('Computed Results', {
            'fields': ('raw_score', 'moderated_score', 'final_score', 'grade', 'points')
        }),
        ('Status', {
            'fields': ('status', 'withheld_reason')
        }),
        ('Audit', {
            'fields': ('entered_by', 'entered_at', 'approved_by', 'approved_at')
        }),
        ('System Info', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_selected_results', 'withhold_selected_results']
    
    def approve_selected_results(self, request, queryset):
        updated = queryset.update(status='APPROVED', approved_by=request.user.username, approved_at=timezone.now())
        self.message_user(request, f'{updated} results approved.')
    approve_selected_results.short_description = 'Approve selected results'
    
    def withhold_selected_results(self, request, queryset):
        queryset.update(status='WITHHELD')
        self.message_user(request, 'Selected results withheld.')
    withhold_selected_results.short_description = 'Withhold selected results'


@admin.register(models.OverallResult)
class OverallResultAdmin(admin.ModelAdmin):
    list_display = [
        'candidate', 'examination_year', 'mean_grade', 
        'total_points', 'subjects_sat', 'status'
    ]
    list_filter = ['status', 'mean_grade', 'examination_year']
    search_fields = ['candidate__index_number', 'candidate__full_name']
    autocomplete_fields = ['candidate', 'mean_grade']
    readonly_fields = ['id', 'computed_at']
    fieldsets = (
        ('Candidate', {
            'fields': ('candidate', 'examination_year')
        }),
        ('Aggregate Results', {
            'fields': ('total_points', 'mean_grade', 'mean_score', 'subjects_sat', 'subjects_counted')
        }),
        ('Rankings', {
            'fields': ('school_rank', 'sub_county_rank', 'county_rank', 'national_rank')
        }),
        ('Status', {
            'fields': ('status', 'withheld_reason', 'remarks')
        }),
        ('Timestamps', {
            'fields': ('computed_at', 'released_at')
        }),
    )


@admin.register(models.AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'action', 'actor', 'index_number', 'description_preview']
    list_filter = ['action', 'timestamp']
    search_fields = ['actor', 'index_number', 'description']
    readonly_fields = ['id', 'timestamp']
    
    def description_preview(self, obj):
        return obj.description[:100] + '...' if len(obj.description) > 100 else obj.description
    description_preview.short_description = 'Description'
    
    def has_add_permission(self, request):
        return False  # Audit logs should only be created programmatically
    
    def has_change_permission(self, request, obj=None):
        return False  # Audit logs should not be modified


@admin.register(models.ResultQuery)
class ResultQueryAdmin(admin.ModelAdmin):
    list_display = ['queried_at', 'index_number', 'full_name_provided', 'was_found', 'ip_address']
    list_filter = ['was_found', 'queried_at']
    search_fields = ['index_number', 'full_name_provided', 'ip_address']
    readonly_fields = ['queried_at']
    
    def has_add_permission(self, request):
        return False  # Query logs should only be created by the system
    
    def has_change_permission(self, request, obj=None):
        return False  # Query logs should not be modified


# ─────────────────────────────────────────────
# DASHBOARD CUSTOMIZATION
# ─────────────────────────────────────────────

admin.site.site_header = 'KCSE Management System'
admin.site.site_title = 'KCSE Admin Portal'
admin.site.index_title = 'Welcome to KCSE Results Management System'