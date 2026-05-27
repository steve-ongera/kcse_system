"""
kcse_project/urls.py
Main URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [

    # Django Admin
    path('admin/', admin.site.urls),

    # API Root
    path('api/', include('core.urls')),

]

# ─────────────────────────────────────────────────────────────
# MEDIA FILES CONFIGURATION
# ─────────────────────────────────────────────────────────────
# Serves uploaded files:
# Example:
# /media/passports/student1.jpg
# /media/result_slips/2026/result.pdf
# ─────────────────────────────────────────────────────────────

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )

# ─────────────────────────────────────────────────────────────
# STATIC FILES CONFIGURATION
# ─────────────────────────────────────────────────────────────
# Serves CSS, JS, Admin files during development
# Example:
# /static/css/style.css
# ─────────────────────────────────────────────────────────────

if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT
    )