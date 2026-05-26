"""
KCSE Management System - Core Models
Kenya National Examinations Council (KNEC) Results Management
"""

from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid


# ─────────────────────────────────────────────
# VALIDATORS
# ─────────────────────────────────────────────

index_number_validator = RegexValidator(
    regex=r'^\d{11}\d{3}$',  # 11-digit center code + 3-digit student number = 14 digits total
    message='Index number must be a 14-digit code: 11-digit school code + 3-digit student number.'
)

kcpe_index_validator = RegexValidator(
    regex=r'^\d{10,12}$',
    message='KCPE index number must be 10–12 digits.'
)

phone_validator = RegexValidator(
    regex=r'^\+?254\d{9}$|^0\d{9}$',
    message='Enter a valid Kenyan phone number e.g. +254712345678 or 0712345678.'
)


# ─────────────────────────────────────────────
# LOOKUP / REFERENCE TABLES
# ─────────────────────────────────────────────

class County(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=5, unique=True)

    class Meta:
        verbose_name_plural = "Counties"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class SubCounty(models.Model):
    county = models.ForeignKey(County, on_delete=models.CASCADE, related_name='sub_counties')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        verbose_name_plural = "Sub Counties"
        ordering = ['name']
        unique_together = ('county', 'name')

    def __str__(self):
        return f"{self.name}, {self.county.name}"


class Subject(models.Model):
    SUBJECT_TYPE_CHOICES = [
        ('COMPULSORY', 'Compulsory'),
        ('GROUP_1', 'Group 1 - Languages'),
        ('GROUP_2', 'Group 2 - Humanities'),
        ('GROUP_3', 'Group 3 - Sciences'),
        ('GROUP_4', 'Group 4 - Technical/Applied'),
        ('GROUP_5', 'Group 5 - Creativity/Arts'),
    ]

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    subject_type = models.CharField(max_length=20, choices=SUBJECT_TYPE_CHOICES)
    max_score = models.PositiveIntegerField(default=100)
    has_practical = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class GradingScale(models.Model):
    """KCSE grading scale: A (12pts) down to E (1pt)"""
    GRADE_CHOICES = [
        ('A', 'A'),
        ('A-', 'A Minus'),
        ('B+', 'B Plus'),
        ('B', 'B'),
        ('B-', 'B Minus'),
        ('C+', 'C Plus'),
        ('C', 'C'),
        ('C-', 'C Minus'),
        ('D+', 'D Plus'),
        ('D', 'D'),
        ('D-', 'D Minus'),
        ('E', 'E'),
        ('X', 'Absent/Cancelled'),
    ]

    grade = models.CharField(max_length=3, choices=GRADE_CHOICES, unique=True)
    points = models.PositiveIntegerField()
    min_score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ['-points']

    def __str__(self):
        return f"{self.grade} ({self.points} pts) [{self.min_score}–{self.max_score}]"


# ─────────────────────────────────────────────
# SCHOOL / EXAMINATION CENTER
# ─────────────────────────────────────────────

class School(models.Model):
    SCHOOL_TYPE_CHOICES = [
        ('NATIONAL', 'National School'),
        ('EXTRA_COUNTY', 'Extra County'),
        ('COUNTY', 'County School'),
        ('SUB_COUNTY', 'Sub County School'),
        ('PRIVATE', 'Private School'),
    ]

    SCHOOL_CATEGORY_CHOICES = [
        ('BOYS', 'Boys School'),
        ('GIRLS', 'Girls School'),
        ('MIXED', 'Mixed School'),
    ]

    center_code = models.CharField(
        max_length=11,
        unique=True,
        validators=[RegexValidator(r'^\d{11}$', '11-digit center code required')]
    )
    name = models.CharField(max_length=200)
    school_type = models.CharField(max_length=20, choices=SCHOOL_TYPE_CHOICES)
    category = models.CharField(max_length=10, choices=SCHOOL_CATEGORY_CHOICES)
    sub_county = models.ForeignKey(SubCounty, on_delete=models.SET_NULL, null=True, related_name='schools')
    postal_address = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15, blank=True, validators=[phone_validator])
    principal_name = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.center_code})"


# ─────────────────────────────────────────────
# EXAMINATION YEAR
# ─────────────────────────────────────────────

class ExaminationYear(models.Model):
    STATUS_CHOICES = [
        ('REGISTRATION_OPEN', 'Registration Open'),
        ('REGISTRATION_CLOSED', 'Registration Closed'),
        ('EXAMINATION_ONGOING', 'Examination Ongoing'),
        ('MARKING_ONGOING', 'Marking Ongoing'),
        ('RESULTS_RELEASED', 'Results Released'),
        ('ARCHIVED', 'Archived'),
    ]

    year = models.PositiveIntegerField(unique=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='REGISTRATION_OPEN')
    registration_deadline = models.DateField(null=True, blank=True)
    exam_start_date = models.DateField(null=True, blank=True)
    exam_end_date = models.DateField(null=True, blank=True)
    results_release_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-year']

    def __str__(self):
        return f"KCSE {self.year} ({self.get_status_display()})"

    @property
    def is_results_released(self):
        return self.status == 'RESULTS_RELEASED'


# ─────────────────────────────────────────────
# CANDIDATE
# ─────────────────────────────────────────────

class Candidate(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]

    # Identification
    index_number = models.CharField(
        max_length=14,
        unique=True,
        validators=[index_number_validator],
        help_text='14-digit KNEC index number (11-digit center code + 3-digit student number)'
    )
    kcpe_index_number = models.CharField(
        max_length=12,
        unique=True,
        validators=[kcpe_index_validator],
        help_text='KCPE index number from primary school'
    )
    birth_certificate_number = models.CharField(max_length=50, unique=True, blank=True, null=True)

    # Personal Information
    full_name = models.CharField(max_length=200, help_text='Full name as it will appear on certificate')
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    nationality = models.CharField(max_length=100, default='Kenyan')
    passport_photo = models.ImageField(upload_to='candidate_photos/', blank=True, null=True)

    # School & Examination
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='candidates')
    examination_year = models.ForeignKey(ExaminationYear, on_delete=models.CASCADE, related_name='candidates')
    subjects = models.ManyToManyField(Subject, through='CandidateSubject', related_name='candidates')

    # Special Needs
    has_special_needs = models.BooleanField(default=False)
    special_needs_details = models.TextField(blank=True)

    # Registration Status
    REGISTRATION_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted to School'),
        ('SCHOOL_VERIFIED', 'School Verified'),
        ('SUB_COUNTY_APPROVED', 'Sub County Approved'),
        ('COUNTY_APPROVED', 'County Approved'),
        ('KNEC_VERIFIED', 'KNEC Verified'),
        ('REJECTED', 'Rejected'),
    ]
    registration_status = models.CharField(
        max_length=20,
        choices=REGISTRATION_STATUS_CHOICES,
        default='DRAFT'
    )
    rejection_reason = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['index_number']
        unique_together = ('school', 'examination_year', 'kcpe_index_number')

    def __str__(self):
        return f"{self.full_name} ({self.index_number})"

    def save(self, *args, **kwargs):
        # Auto-construct full name from parts if not explicitly set
        if self.first_name and self.last_name and not self.full_name:
            parts = [self.first_name]
            if self.middle_name:
                parts.append(self.middle_name)
            parts.append(self.last_name)
            self.full_name = ' '.join(parts).upper()
        super().save(*args, **kwargs)

    @property
    def center_code(self):
        return self.index_number[:11]

    @property
    def student_number(self):
        return self.index_number[11:]


class CandidateSubject(models.Model):
    """Through model tracking which subjects a candidate is registered for"""
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('candidate', 'subject')

    def __str__(self):
        return f"{self.candidate.full_name} - {self.subject.name}"


# ─────────────────────────────────────────────
# EXAMINATION RESULTS
# ─────────────────────────────────────────────

class SubjectResult(models.Model):
    """Individual subject marks and grade for a candidate"""
    RESULT_STATUS_CHOICES = [
        ('PENDING', 'Pending Entry'),
        ('ENTERED', 'Marks Entered'),
        ('VALIDATED', 'Validated'),
        ('MODERATED', 'Moderated'),
        ('APPROVED', 'Approved'),
        ('WITHHELD', 'Withheld'),
        ('CANCELLED', 'Cancelled'),
        ('ABSENT', 'Absent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='subject_results')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    examination_year = models.ForeignKey(ExaminationYear, on_delete=models.CASCADE)

    # Paper scores (some subjects have multiple papers)
    paper1_score = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    paper2_score = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    paper3_score = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    practical_score = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Computed totals
    raw_score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    moderated_score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    final_score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Grade
    grade = models.ForeignKey(GradingScale, on_delete=models.SET_NULL, null=True, blank=True)
    points = models.PositiveIntegerField(null=True, blank=True)

    status = models.CharField(max_length=15, choices=RESULT_STATUS_CHOICES, default='PENDING')
    withheld_reason = models.TextField(blank=True)

    # Audit
    entered_by = models.CharField(max_length=200, blank=True)
    entered_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.CharField(max_length=200, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('candidate', 'subject', 'examination_year')
        ordering = ['subject__code']

    def __str__(self):
        return f"{self.candidate.full_name} | {self.subject.code} | {self.grade or 'Pending'}"


class OverallResult(models.Model):
    """Aggregated KCSE result for a candidate"""
    RESULT_STATUS_CHOICES = [
        ('PROVISIONAL', 'Provisional'),
        ('FINAL', 'Final'),
        ('WITHHELD', 'Withheld'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.OneToOneField(
        Candidate, on_delete=models.CASCADE, related_name='overall_result'
    )
    examination_year = models.ForeignKey(ExaminationYear, on_delete=models.CASCADE)

    # KCSE aggregate: best 7 subjects (English + Kiswahili compulsory + best 5 others)
    total_points = models.PositiveIntegerField(null=True, blank=True)
    mean_grade = models.ForeignKey(
        GradingScale, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='overall_results'
    )
    mean_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Subject count
    subjects_sat = models.PositiveIntegerField(default=0)
    subjects_counted = models.PositiveIntegerField(default=7)

    # Rankings
    school_rank = models.PositiveIntegerField(null=True, blank=True)
    sub_county_rank = models.PositiveIntegerField(null=True, blank=True)
    county_rank = models.PositiveIntegerField(null=True, blank=True)
    national_rank = models.PositiveIntegerField(null=True, blank=True)

    status = models.CharField(max_length=15, choices=RESULT_STATUS_CHOICES, default='PROVISIONAL')
    withheld_reason = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    # Timestamps
    computed_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-total_points']

    def __str__(self):
        return (
            f"{self.candidate.full_name} | "
            f"{self.examination_year.year} | "
            f"{self.mean_grade or 'Pending'} ({self.total_points or 0} pts)"
        )


# ─────────────────────────────────────────────
# AUDIT / SECURITY
# ─────────────────────────────────────────────

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('RESULT_VIEW', 'Result Viewed'),
        ('RESULT_QUERY', 'Result Queried'),
        ('REGISTRATION_CREATE', 'Registration Created'),
        ('REGISTRATION_UPDATE', 'Registration Updated'),
        ('MARKS_ENTRY', 'Marks Entered'),
        ('MARKS_APPROVAL', 'Marks Approved'),
        ('RESULT_RELEASE', 'Result Released'),
        ('RESULT_WITHHELD', 'Result Withheld'),
        ('ADMIN_ACTION', 'Admin Action'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    actor = models.CharField(max_length=200, blank=True, help_text='User or system that performed the action')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    index_number = models.CharField(max_length=14, blank=True, help_text='Candidate index number if applicable')
    description = models.TextField()
    extra_data = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.get_action_display()} by {self.actor or 'anonymous'}"


class ResultQuery(models.Model):
    """Track every result lookup for analytics and security"""
    index_number = models.CharField(max_length=14)
    full_name_provided = models.CharField(max_length=200)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    was_found = models.BooleanField(default=False)
    queried_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-queried_at']

    def __str__(self):
        return f"{self.index_number} | {'Found' if self.was_found else 'Not Found'} | {self.queried_at}"