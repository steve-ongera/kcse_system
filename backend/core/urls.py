"""
KCSE Management System - URL Configuration
"""

from django.urls import path
from . import views


urlpatterns = [

    # ── PUBLIC (No Authentication Required) ──────────────────────────────
    path(
        'results/lookup/',
        views.ResultLookupView.as_view(),
        name='result-lookup'
    ),
    path(
        'reference/years/',
        views.active_examination_years,
        name='active-years'
    ),
    path(
        'reference/grading-scale/',
        views.grading_scale,
        name='grading-scale'
    ),

    # ── ADMIN: CANDIDATE MANAGEMENT ───────────────────────────────────────
    path(
        'admin/candidates/',
        views.CandidateListView.as_view(),
        name='candidate-list'
    ),
    path(
        'admin/candidates/register/',
        views.CandidateRegistrationView.as_view(),
        name='candidate-register'
    ),
    path(
        'admin/candidates/<str:index_number>/',
        views.CandidateDetailView.as_view(),
        name='candidate-detail'
    ),

    # ── ADMIN: MARKS / RESULTS ───────────────────────────────────────────
    path(
        'admin/marks/enter/',
        views.SubjectResultEntryView.as_view(),
        name='marks-enter'
    ),
    path(
        'admin/marks/<uuid:pk>/approve/',
        views.SubjectResultApproveView.as_view(),
        name='marks-approve'
    ),

    # ── ADMIN: ANALYTICS ─────────────────────────────────────────────────
    path(
        'admin/analytics/school/<str:center_code>/',
        views.SchoolPerformanceView.as_view(),
        name='school-performance'
    ),

    # ── ADMIN: AUDIT LOGS ────────────────────────────────────────────────
    path(
        'admin/audit-logs/',
        views.AuditLogListView.as_view(),
        name='audit-logs'
    ),
]