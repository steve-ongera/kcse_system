"""
Management command: seed_data
Populates the KCSE Management System with realistic Kenyan data.

Coverage:
  - All 47 Kenyan counties + sub-counties
  - KCSE subjects (compulsory + optional groups)
  - Grading scale (A → E)
  - ~120 schools spread across counties
  - Examination years: 2000 – 2024
  - ~3,000 candidates spread across years / schools
  - Subject results + overall results per candidate
  - Sample audit log and result-query records

Usage:
    python manage.py seed_data
    python manage.py seed_data --years 2015 2024   # restrict year range
    python manage.py seed_data --candidates 5000   # override candidate count
    python manage.py seed_data --clear             # wipe existing data first
"""

import random
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.models import (
    AuditLog,
    Candidate,
    CandidateSubject,
    County,
    ExaminationYear,
    GradingScale,
    OverallResult,
    ResultQuery,
    School,
    SubCounty,
    Subject,
    SubjectResult,
)


# ─────────────────────────────────────────────────────────────
# STATIC KENYAN REFERENCE DATA
# ─────────────────────────────────────────────────────────────

COUNTIES = [
    ("Mombasa", "001"), ("Kwale", "002"), ("Kilifi", "003"), ("Tana River", "004"),
    ("Lamu", "005"), ("Taita-Taveta", "006"), ("Garissa", "007"), ("Wajir", "008"),
    ("Mandera", "009"), ("Marsabit", "010"), ("Isiolo", "011"), ("Meru", "012"),
    ("Tharaka-Nithi", "013"), ("Embu", "014"), ("Kitui", "015"), ("Machakos", "016"),
    ("Makueni", "017"), ("Nyandarua", "018"), ("Nyeri", "019"), ("Kirinyaga", "020"),
    ("Murang'a", "021"), ("Kiambu", "022"), ("Turkana", "023"), ("West Pokot", "024"),
    ("Samburu", "025"), ("Trans Nzoia", "026"), ("Uasin Gishu", "027"), ("Elgeyo-Marakwet", "028"),
    ("Nandi", "029"), ("Baringo", "030"), ("Laikipia", "031"), ("Nakuru", "032"),
    ("Narok", "033"), ("Kajiado", "034"), ("Kericho", "035"), ("Bomet", "036"),
    ("Kakamega", "037"), ("Vihiga", "038"), ("Bungoma", "039"), ("Busia", "040"),
    ("Siaya", "041"), ("Kisumu", "042"), ("Homa Bay", "043"), ("Migori", "044"),
    ("Kisii", "045"), ("Nyamira", "046"), ("Nairobi", "047"),
]

# sub-counties per county (2–4 each, realistic names)
SUB_COUNTIES_MAP = {
    "Mombasa": ["Mvita", "Changamwe", "Likoni", "Kisauni"],
    "Kwale": ["Matuga", "Msambweni", "Lunga Lunga", "Kinango"],
    "Kilifi": ["Kilifi North", "Kilifi South", "Malindi", "Magarini"],
    "Tana River": ["Bura", "Galole", "Garsen"],
    "Lamu": ["Lamu East", "Lamu West"],
    "Taita-Taveta": ["Taveta", "Wundanyi", "Mwatate", "Voi"],
    "Garissa": ["Garissa Township", "Balambala", "Lagdera", "Dadaab"],
    "Wajir": ["Wajir East", "Wajir West", "Wajir North", "Tarbaj"],
    "Mandera": ["Mandera East", "Mandera West", "Mandera North", "Lafey"],
    "Marsabit": ["Moyale", "North Horr", "Saku", "Laisamis"],
    "Isiolo": ["Isiolo North", "Isiolo South"],
    "Meru": ["Imenti North", "Imenti Central", "Imenti South", "Tigania West"],
    "Tharaka-Nithi": ["Tharaka North", "Tharaka South", "Chuka"],
    "Embu": ["Embu East", "Embu West", "Manyatta", "Runyenjes"],
    "Kitui": ["Kitui Central", "Kitui East", "Kitui South", "Mwingi North"],
    "Machakos": ["Machakos Town", "Masinga", "Yatta", "Kangundo"],
    "Makueni": ["Makueni", "Kilome", "Kaiti", "Mbooni"],
    "Nyandarua": ["Kinangop", "Kipipiri", "Ol Kalou", "Ndaragwa"],
    "Nyeri": ["Nyeri Town", "Kieni East", "Tetu", "Mukurwe-ini"],
    "Kirinyaga": ["Kirinyaga Central", "Gichugu", "Ndia", "Mwea"],
    "Murang'a": ["Kiharu", "Kigumo", "Maragua", "Kandara"],
    "Kiambu": ["Thika Town", "Ruiru", "Gatundu North", "Limuru"],
    "Turkana": ["Turkana Central", "Turkana East", "Turkana North", "Loima"],
    "West Pokot": ["Pokot North", "Pokot South", "Sigor", "Kacheliba"],
    "Samburu": ["Samburu East", "Samburu North", "Samburu West"],
    "Trans Nzoia": ["Cherangany", "Endebess", "Kwanza", "Saboti"],
    "Uasin Gishu": ["Ainabkoi", "Kapseret", "Kesses", "Soy"],
    "Elgeyo-Marakwet": ["Keiyo North", "Keiyo South", "Marakwet East", "Marakwet West"],
    "Nandi": ["Nandi Hills", "Chesumei", "Emgwen", "Mosop"],
    "Baringo": ["Baringo Central", "Baringo North", "Baringo South", "Tiaty"],
    "Laikipia": ["Laikipia East", "Laikipia North", "Laikipia West"],
    "Nakuru": ["Nakuru Town East", "Nakuru Town West", "Naivasha", "Gilgil"],
    "Narok": ["Narok North", "Narok South", "Narok East", "Narok West"],
    "Kajiado": ["Kajiado Central", "Kajiado East", "Kajiado North", "Loitokitok"],
    "Kericho": ["Ainamoi", "Belgut", "Bureti", "Kipkelion East"],
    "Bomet": ["Bomet Central", "Chepalungu", "Konoin", "Sotik"],
    "Kakamega": ["Lugari", "Likuyani", "Kakamega Central", "Shinyalu"],
    "Vihiga": ["Emuhaya", "Hamisi", "Luanda", "Sabatia"],
    "Bungoma": ["Bumula", "Kabuchai", "Kanduyi", "Mt Elgon"],
    "Busia": ["Bunyala", "Butula", "Funyula", "Nambale"],
    "Siaya": ["Alego Usonga", "Bondo", "Gem", "Rarieda"],
    "Kisumu": ["Kisumu Central", "Kisumu East", "Kisumu West", "Nyando"],
    "Homa Bay": ["Homa Bay Town", "Karachuonyo", "Kasipul", "Ndhiwa"],
    "Migori": ["Awendo", "Kuria East", "Kuria West", "Nyatike"],
    "Kisii": ["Bonchari", "Bomachoge Borabu", "Kitutu Chache North", "South Mugirango"],
    "Nyamira": ["Borabu", "Manga", "Masaba North", "Nyamira North"],
    "Nairobi": ["Westlands", "Dagoretti North", "Langata", "Kibra", "Roysambu", "Kasarani", "Ruaraka", "Embakasi South"],
}

SUBJECTS_DATA = [
    # code, name, type, has_practical
    ("ENG", "English Language",            "COMPULSORY", False),
    ("KSW", "Kiswahili",                   "COMPULSORY", False),
    ("MTH", "Mathematics",                 "COMPULSORY", False),
    ("BIO", "Biology",                     "GROUP_3",    True),
    ("CHE", "Chemistry",                   "GROUP_3",    True),
    ("PHY", "Physics",                     "GROUP_3",    True),
    ("HIS", "History & Government",        "GROUP_2",    False),
    ("GEO", "Geography",                   "GROUP_2",    False),
    ("CRE", "Christian Religious Education","GROUP_2",   False),
    ("IRE", "Islamic Religious Education", "GROUP_2",    False),
    ("HRE", "Hindu Religious Education",   "GROUP_2",    False),
    ("HSC", "Home Science",                "GROUP_4",    True),
    ("ART", "Art & Design",                "GROUP_5",    True),
    ("AGR", "Agriculture",                 "GROUP_4",    True),
    ("WOD", "Woodwork",                    "GROUP_4",    True),
    ("MET", "Metalwork",                   "GROUP_4",    True),
    ("BCT", "Building Construction",       "GROUP_4",    True),
    ("PPR", "Power Mechanics",             "GROUP_4",    True),
    ("ELC", "Electricity",                 "GROUP_4",    True),
    ("ACC", "Accounting",                  "GROUP_2",    False),
    ("BUS", "Business Studies",            "GROUP_2",    False),
    ("ECO", "Economics",                   "GROUP_2",    False),
    ("FRN", "French",                      "GROUP_1",    False),
    ("GER", "German",                      "GROUP_1",    False),
    ("ARA", "Arabic",                      "GROUP_1",    False),
    ("MUS", "Music",                       "GROUP_5",    True),
]

GRADING_SCALE = [
    # grade, points, min_score, max_score
    ("A",   12, Decimal("80.00"),  Decimal("100.00")),
    ("A-",  11, Decimal("75.00"),  Decimal("79.99")),
    ("B+",  10, Decimal("70.00"),  Decimal("74.99")),
    ("B",    9, Decimal("65.00"),  Decimal("69.99")),
    ("B-",   8, Decimal("60.00"),  Decimal("64.99")),
    ("C+",   7, Decimal("55.00"),  Decimal("59.99")),
    ("C",    6, Decimal("50.00"),  Decimal("54.99")),
    ("C-",   5, Decimal("45.00"),  Decimal("49.99")),
    ("D+",   4, Decimal("40.00"),  Decimal("44.99")),
    ("D",    3, Decimal("35.00"),  Decimal("39.99")),
    ("D-",   2, Decimal("30.00"),  Decimal("34.99")),
    ("E",    1, Decimal("0.00"),   Decimal("29.99")),
]

SCHOOL_NAME_PREFIXES = [
    "St. Mary's", "St. Joseph's", "St. Francis", "St. Peter's", "St. Patrick's",
    "Alliance", "Starehe", "Moi", "Lenana", "Precious Blood",
    "Kenya High", "Light", "Pioneer", "Sunrise", "Hilcrest",
    "Nairobi", "Kisumu", "Mombasa", "Nakuru", "Eldoret",
    "Thika", "Nyeri", "Kisii", "Embu", "Muranga",
    "Kabarak", "Kangundo", "Makueni", "Machakos", "Kajiado",
    "Bunyore", "Chavakali", "Friends", "Kakamega", "Butere",
    "Mangu", "Chania", "Githunguri", "Kiambu", "Limuru",
    "Kerugoya", "Kamuthe", "Nkubu", "Meru", "Isiolo",
    "Garissa", "Wajir", "Mandera", "Lodwar", "Kitale",
]
SCHOOL_NAME_SUFFIXES = [
    "High School", "Secondary School", "Boys High School", "Girls High School",
    "Mixed Secondary School", "National School",
]

KENYAN_FIRST_NAMES_M = [
    "Brian", "Kevin", "Dennis", "Patrick", "Michael", "David", "James", "John",
    "Peter", "Paul", "George", "Robert", "Joseph", "Samuel", "Daniel", "Emmanuel",
    "Francis", "Moses", "Isaac", "Jacob", "Elijah", "Nathan", "Simon", "Andrew",
    "Mark", "Luke", "Joshua", "Caleb", "Ezekiel", "Timothy", "Victor", "Richard",
    "Clinton", "Edwin", "Collins", "Felix", "Geoffrey", "Harrison", "Ian", "Julius",
    "Kennedy", "Leonard", "Martin", "Newton", "Oscar", "Philip", "Quentin", "Raphael",
    "Stephen", "Thomas", "Usman", "Vincent", "Walter", "Xavier", "Yusuf", "Zachary",
    "Otieno", "Kamau", "Mwangi", "Kariuki", "Njenga", "Mutua", "Omondi", "Abubakar",
]

KENYAN_FIRST_NAMES_F = [
    "Ann", "Grace", "Mary", "Faith", "Hope", "Joyce", "Rose", "Jane", "Alice",
    "Catherine", "Dorothy", "Elizabeth", "Florence", "Gloria", "Helen", "Irene",
    "Judith", "Karen", "Linda", "Margaret", "Nancy", "Olivia", "Pauline", "Rachel",
    "Sarah", "Teresa", "Ursula", "Veronica", "Wanjiru", "Ximena", "Yvonne", "Zipporah",
    "Aisha", "Fatuma", "Halima", "Imani", "Jacqueline", "Kerubo", "Lupita", "Mercy",
    "Njeri", "Odette", "Patricia", "Queen", "Regina", "Stella", "Tabitha", "Umi",
    "Vivian", "Winnie", "Zawadi", "Amina", "Beatrice", "Cecilia", "Diana", "Edith",
]

KENYAN_LAST_NAMES = [
    "Kamau", "Mwangi", "Kariuki", "Omondi", "Otieno", "Owino", "Mutua", "Mutiso",
    "Njenga", "Njoroge", "Gitau", "Kimani", "Waweru", "Wambua", "Ndungu", "Mugo",
    "Maina", "Kibet", "Ruto", "Koech", "Mutai", "Kiptoo", "Chirchir", "Bett",
    "Hassan", "Mohammed", "Ali", "Omar", "Abdi", "Ahmed", "Ibrahim", "Yusuf",
    "Achieng", "Adhiambo", "Awino", "Auma", "Akoth", "Anyango", "Atieno", "Adongo",
    "Wanjiku", "Waithira", "Wangechi", "Wairimu", "Wanjiru", "Wambui", "Wacera",
    "Kipchoge", "Kiptanui", "Ngeno", "Chebet", "Chepkoech", "Rotich", "Ngetich",
    "Musyoka", "Muthiani", "Nzoka", "Mutuku", "Mwilu", "Ndunda", "Munyao",
    "Lumumba", "Barasa", "Wafula", "Simiyu", "Wangwe", "Masinde", "Makokha",
    "Oduya", "Odinga", "Obiero", "Okoth", "Opondo", "Ongaro", "Odero", "Ochieng",
]

MIDDLE_NAMES = [
    "Wanjiku", "Kamau", "Mwangi", "Wambua", "Kariuki", "Omondi", "Otieno",
    "Mutua", "Njenga", "Gitau", "Hassan", "Mohammed", "Achieng", "Owino",
    "Kipchoge", "Koech", "Musyoka", "Lumumba", "Barasa", "Oduya", "",
    "Grace", "Faith", "Hope", "Joy", "Love", "Peace", "Mercy", "Blessing",
    "Victor", "Emmanuel", "Samson", "Solomon", "", "", "",  # blanks → no middle name
]

EXAM_YEAR_STATUS = {
    range(2000, 2023): "RESULTS_RELEASED",
    range(2023, 2024): "RESULTS_RELEASED",
    range(2024, 2025): "RESULTS_RELEASED",
}


# ─────────────────────────────────────────────────────────────
# HELPER UTILITIES
# ─────────────────────────────────────────────────────────────

def rand_phone():
    prefixes = ["0701", "0711", "0720", "0721", "0722", "0723", "0724",
                "0725", "0726", "0727", "0728", "0729", "0740", "0745",
                "0757", "0768", "0769", "0790", "0791", "0792", "0110",
                "0111", "0114", "0115", "0116"]
    return random.choice(prefixes) + "".join([str(random.randint(0, 9)) for _ in range(6)])


def rand_email(name: str, domain: str = None) -> str:
    domains = ["gmail.com", "yahoo.com", "hotmail.com", "school.ac.ke", "edu.co.ke"]
    slug = name.lower().replace(" ", ".").replace("'", "")[:20]
    return f"{slug}{random.randint(1, 999)}@{domain or random.choice(domains)}"


def score_to_grade(score: Decimal, scale: list[GradingScale]) -> GradingScale | None:
    for gs in scale:
        if gs.min_score <= score <= gs.max_score:
            return gs
    return scale[-1]  # fallback to E


def random_dob(year: int) -> date:
    """Candidate was typically 17-19 years old during exam year."""
    birth_year = year - random.randint(17, 19)
    return date(birth_year, random.randint(1, 12), random.randint(1, 28))


def exam_dates(year: int):
    start = date(year, 10, 22)
    end = date(year, 11, 15)
    reg_deadline = date(year, 3, 31)
    results = timezone.make_aware(
        timezone.datetime(year + 1, 3, random.randint(10, 20), 8, 0)
    )
    return reg_deadline, start, end, results


# ─────────────────────────────────────────────────────────────
# COMMAND
# ─────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed the KCSE database with realistic Kenyan data (2000–2024)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--years",
            nargs=2,
            type=int,
            metavar=("START", "END"),
            default=[2000, 2024],
            help="Year range inclusive (default 2000 2024)",
        )
        parser.add_argument(
            "--candidates",
            type=int,
            default=3000,
            help="Approximate total candidates to create (default 3000)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all existing seeded data before inserting",
        )

    # ── entry point ──────────────────────────────────────────

    def handle(self, *args, **options):
        year_start, year_end = options["years"]
        if year_start > year_end:
            raise CommandError("START year must be ≤ END year")

        total_candidates = options["candidates"]
        years = list(range(year_start, year_end + 1))

        if options["clear"]:
            self._clear_data()

        with transaction.atomic():
            self.stdout.write("── 1/8  Grading scale …")
            grade_objs = self._seed_grading_scale()

            self.stdout.write("── 2/8  Subjects …")
            subject_objs = self._seed_subjects()

            self.stdout.write("── 3/8  Counties & sub-counties …")
            sub_county_objs = self._seed_geography()

            self.stdout.write("── 4/8  Schools …")
            school_objs = self._seed_schools(sub_county_objs)

            self.stdout.write("── 5/8  Examination years …")
            exam_year_objs = self._seed_exam_years(years)

            self.stdout.write(f"── 6/8  Candidates (~{total_candidates}) …")
            candidate_objs = self._seed_candidates(
                total_candidates, school_objs, exam_year_objs, subject_objs
            )

            self.stdout.write("── 7/8  Subject & overall results …")
            self._seed_results(candidate_objs, grade_objs, exam_year_objs)

            self.stdout.write("── 8/8  Audit logs & result queries …")
            self._seed_audit(candidate_objs)

        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Seeding complete — "
            f"{len(years)} exam years | "
            f"{len(school_objs)} schools | "
            f"{len(candidate_objs)} candidates"
        ))

    # ── clear ────────────────────────────────────────────────

    def _clear_data(self):
        self.stdout.write(self.style.WARNING("  Clearing existing data …"))
        ResultQuery.objects.all().delete()
        AuditLog.objects.all().delete()
        OverallResult.objects.all().delete()
        SubjectResult.objects.all().delete()
        CandidateSubject.objects.all().delete()
        Candidate.objects.all().delete()
        School.objects.all().delete()
        ExaminationYear.objects.all().delete()
        SubCounty.objects.all().delete()
        County.objects.all().delete()
        Subject.objects.all().delete()
        GradingScale.objects.all().delete()
        self.stdout.write("  Done clearing.")

    # ── grading scale ────────────────────────────────────────

    def _seed_grading_scale(self) -> list:
        objs = []
        for grade, points, mn, mx in GRADING_SCALE:
            gs, _ = GradingScale.objects.get_or_create(
                grade=grade,
                defaults={"points": points, "min_score": mn, "max_score": mx},
            )
            objs.append(gs)
        self.stdout.write(f"    {len(objs)} grades")
        return objs

    # ── subjects ─────────────────────────────────────────────

    def _seed_subjects(self) -> list:
        objs = []
        for code, name, stype, practical in SUBJECTS_DATA:
            s, _ = Subject.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "subject_type": stype,
                    "has_practical": practical,
                    "max_score": 100,
                    "is_active": True,
                },
            )
            objs.append(s)
        self.stdout.write(f"    {len(objs)} subjects")
        return objs

    # ── geography ────────────────────────────────────────────

    def _seed_geography(self) -> list:
        sc_objs = []
        county_counter = {}

        for cname, ccode in COUNTIES:
            county, _ = County.objects.get_or_create(
                code=ccode, defaults={"name": cname}
            )
            sc_names = SUB_COUNTIES_MAP.get(cname, [f"{cname} Central", f"{cname} East"])
            county_counter[ccode] = county_counter.get(ccode, 0)

            for i, sc_name in enumerate(sc_names, start=1):
                sc_code = f"{ccode}{str(i).zfill(2)}"
                sc, _ = SubCounty.objects.get_or_create(
                    code=sc_code,
                    defaults={"county": county, "name": sc_name},
                )
                sc_objs.append(sc)

        self.stdout.write(f"    47 counties | {len(sc_objs)} sub-counties")
        return sc_objs

    # ── schools ──────────────────────────────────────────────

    def _seed_schools(self, sub_county_objs: list) -> list:
        school_types = ["NATIONAL", "EXTRA_COUNTY", "COUNTY", "SUB_COUNTY", "PRIVATE"]
        categories = ["BOYS", "GIRLS", "MIXED"]
        weights_type = [0.03, 0.07, 0.20, 0.50, 0.20]
        weights_cat  = [0.30, 0.30, 0.40]

        objs = []
        used_codes = set(School.objects.values_list("center_code", flat=True))
        used_names = set(School.objects.values_list("name", flat=True))

        target = 120
        attempts = 0
        while len(objs) < target and attempts < 5000:
            attempts += 1
            sc = random.choice(sub_county_objs)
            county_code = sc.code[:3]  # first 3 digits = county code (zero-padded)

            # build 11-digit center code: county(3) + subcounty_seq(2) + random(6)
            rand_suffix = "".join([str(random.randint(0, 9)) for _ in range(6)])
            center_code = f"{county_code}{sc.code[-2:]}{rand_suffix}"
            if center_code in used_codes:
                continue

            prefix = random.choice(SCHOOL_NAME_PREFIXES)
            suffix = random.choice(SCHOOL_NAME_SUFFIXES)
            name = f"{prefix} {suffix}"
            if name in used_names:
                name = f"{prefix} {sc.county.name} {suffix}"
            if name in used_names:
                continue

            stype = random.choices(school_types, weights=weights_type)[0]
            cat   = random.choices(categories,   weights=weights_cat)[0]

            school = School.objects.create(
                center_code=center_code,
                name=name,
                school_type=stype,
                category=cat,
                sub_county=sc,
                postal_address=f"P.O. Box {random.randint(1, 9999)}-{random.randint(10000,99999)}, Kenya",
                email=rand_email(name, "school.ac.ke"),
                phone=rand_phone(),
                principal_name=self._random_full_name(random.choice(["M", "F"])),
                is_active=True,
            )
            objs.append(school)
            used_codes.add(center_code)
            used_names.add(name)

        self.stdout.write(f"    {len(objs)} schools")
        return objs

    # ── exam years ───────────────────────────────────────────

    def _seed_exam_years(self, years: list) -> list:
        objs = []
        for y in years:
            reg_deadline, start, end, results_dt = exam_dates(y)

            if y < 2024:
                status = "RESULTS_RELEASED"
            elif y == 2024:
                status = "RESULTS_RELEASED"
            else:
                status = "REGISTRATION_OPEN"

            ey, _ = ExaminationYear.objects.get_or_create(
                year=y,
                defaults={
                    "status": status,
                    "registration_deadline": reg_deadline,
                    "exam_start_date": start,
                    "exam_end_date": end,
                    "results_release_date": results_dt,
                },
            )
            objs.append(ey)
        self.stdout.write(f"    {len(objs)} exam years ({years[0]}–{years[-1]})")
        return objs

    # ── candidates ───────────────────────────────────────────

    def _seed_candidates(
        self,
        total: int,
        schools: list,
        exam_years: list,
        subjects: list,
    ) -> list:
        compulsory = [s for s in subjects if s.subject_type == "COMPULSORY"]  # ENG, KSW, MTH
        optional   = [s for s in subjects if s.subject_type != "COMPULSORY"]

        # Weight years: more candidates in recent years
        year_weights = [0.5 + (i / len(exam_years)) for i in range(len(exam_years))]

        all_candidates = []
        used_index_numbers = set(Candidate.objects.values_list("index_number", flat=True))
        used_kcpe          = set(Candidate.objects.values_list("kcpe_index_number", flat=True))
        used_bc            = set(Candidate.objects.values_list("birth_certificate_number", flat=True))

        reg_statuses = [
            "DRAFT", "SUBMITTED", "SCHOOL_VERIFIED",
            "SUB_COUNTY_APPROVED", "COUNTY_APPROVED", "KNEC_VERIFIED",
        ]
        reg_weights = [0.01, 0.02, 0.05, 0.07, 0.10, 0.75]

        batch = []
        cs_batch = []

        for _ in range(total * 3):  # over-generate to handle collisions
            if len(all_candidates) + len(batch) >= total:
                break

            school = random.choice(schools)
            exam_year = random.choices(exam_years, weights=year_weights)[0]
            gender = random.choice(["M", "F"])

            # 11-digit center code from school + 3-digit student serial
            student_serial = str(random.randint(1, 499)).zfill(3)
            index_number   = f"{school.center_code}{student_serial}"
            if index_number in used_index_numbers:
                continue

            kcpe_index = "".join([str(random.randint(0, 9)) for _ in range(11)])
            if kcpe_index in used_kcpe:
                continue

            bc_num = f"BC{random.randint(10000000, 99999999)}"
            if bc_num in used_bc:
                continue

            first  = random.choice(KENYAN_FIRST_NAMES_M if gender == "M" else KENYAN_FIRST_NAMES_F)
            middle = random.choice(MIDDLE_NAMES)
            last   = random.choice(KENYAN_LAST_NAMES)

            parts = [first]
            if middle:
                parts.append(middle)
            parts.append(last)
            full_name = " ".join(parts).upper()

            dob = random_dob(exam_year.year)

            reg_status = random.choices(reg_statuses, weights=reg_weights)[0]
            has_sn = random.random() < 0.02  # 2 % special needs

            c = Candidate(
                index_number=index_number,
                kcpe_index_number=kcpe_index,
                birth_certificate_number=bc_num,
                full_name=full_name,
                first_name=first,
                middle_name=middle,
                last_name=last,
                gender=gender,
                date_of_birth=dob,
                nationality="Kenyan",
                school=school,
                examination_year=exam_year,
                has_special_needs=has_sn,
                special_needs_details="Requires extra time" if has_sn else "",
                registration_status=reg_status,
            )
            batch.append(c)
            used_index_numbers.add(index_number)
            used_kcpe.add(kcpe_index)
            used_bc.add(bc_num)

            # pick 7–9 subjects: all 3 compulsory + 4–6 optional
            n_opt = random.randint(4, 6)
            chosen_subjects = compulsory + random.sample(optional, n_opt)
            for subj in chosen_subjects:
                cs_batch.append(CandidateSubject(candidate=c, subject=subj))

        # bulk create
        Candidate.objects.bulk_create(batch, batch_size=500)
        # re-fetch to get PKs
        created = list(
            Candidate.objects.filter(
                index_number__in=[c.index_number for c in batch]
            )
        )

        # fix FK references in CandidateSubject
        idx_to_pk = {c.index_number: c for c in created}
        real_cs = []
        seen_cs = set()
        for cs in cs_batch:
            real_c = idx_to_pk.get(cs.candidate.index_number)
            if real_c:
                key = (real_c.pk, cs.subject_id)
                if key not in seen_cs:
                    seen_cs.add(key)
                    real_cs.append(CandidateSubject(candidate=real_c, subject=cs.subject))
        CandidateSubject.objects.bulk_create(real_cs, batch_size=1000, ignore_conflicts=True)

        all_candidates = created
        self.stdout.write(f"    {len(all_candidates)} candidates | {len(real_cs)} subject registrations")
        return all_candidates

    # ── results ──────────────────────────────────────────────

    def _seed_results(
        self,
        candidates: list,
        grade_objs: list,
        exam_years: list,
    ):
        # Only create results for candidates in RESULTS_RELEASED years
        released_year_ids = {
            ey.pk for ey in exam_years if ey.status == "RESULTS_RELEASED"
        }

        # Pre-fetch candidate subjects
        cs_map: dict[int, list] = {}
        for cs in CandidateSubject.objects.filter(
            candidate__in=candidates
        ).select_related("subject"):
            cs_map.setdefault(cs.candidate_id, []).append(cs.subject)

        sr_batch = []
        or_batch = []

        result_statuses = ["APPROVED", "APPROVED", "APPROVED", "VALIDATED", "MODERATED"]

        for candidate in candidates:
            if candidate.examination_year_id not in released_year_ids:
                continue

            subj_list = cs_map.get(candidate.pk, [])
            if not subj_list:
                continue

            subject_points = []
            for subj in subj_list:
                # Generate a plausible score; slightly skewed toward C range
                raw = Decimal(str(round(random.gauss(52, 18), 2))).max(Decimal("0")).min(Decimal("100"))
                # paper splits
                if subj.has_practical:
                    p1 = Decimal(str(round(float(raw) * 0.40, 2)))
                    p2 = Decimal(str(round(float(raw) * 0.30, 2)))
                    practical = Decimal(str(round(float(raw) * 0.30, 2)))
                    p3 = None
                else:
                    p1 = Decimal(str(round(float(raw) * 0.50, 2)))
                    p2 = Decimal(str(round(float(raw) * 0.50, 2)))
                    practical = None
                    p3 = None

                grade_obj = score_to_grade(raw, grade_objs)
                status = random.choice(result_statuses)

                sr = SubjectResult(
                    id=uuid.uuid4(),
                    candidate=candidate,
                    subject=subj,
                    examination_year=candidate.examination_year,
                    paper1_score=p1,
                    paper2_score=p2,
                    paper3_score=p3,
                    practical_score=practical,
                    raw_score=raw,
                    moderated_score=raw,
                    final_score=raw,
                    grade=grade_obj,
                    points=grade_obj.points if grade_obj else None,
                    status=status,
                    entered_by="system_seed",
                    entered_at=timezone.now(),
                    approved_by="system_seed",
                    approved_at=timezone.now(),
                )
                sr_batch.append(sr)
                if grade_obj:
                    subject_points.append((grade_obj.points, raw))

            # Overall result: best 7 subjects by points
            if subject_points:
                best7 = sorted(subject_points, key=lambda x: x[0], reverse=True)[:7]
                total_pts = sum(p for p, _ in best7)
                mean_raw = Decimal(str(round(sum(s for _, s in best7) / len(best7), 2)))
                mean_grade = score_to_grade(mean_raw, grade_objs)

                ov = OverallResult(
                    id=uuid.uuid4(),
                    candidate=candidate,
                    examination_year=candidate.examination_year,
                    total_points=total_pts,
                    mean_grade=mean_grade,
                    mean_score=mean_raw,
                    subjects_sat=len(subj_list),
                    subjects_counted=len(best7),
                    status="FINAL",
                    released_at=candidate.examination_year.results_release_date,
                )
                or_batch.append(ov)

        SubjectResult.objects.bulk_create(sr_batch, batch_size=500, ignore_conflicts=True)
        OverallResult.objects.bulk_create(or_batch, batch_size=500, ignore_conflicts=True)

        # compute school ranks (in-memory, per year per school)
        self._compute_ranks(or_batch)

        self.stdout.write(
            f"    {len(sr_batch)} subject results | {len(or_batch)} overall results"
        )

    def _compute_ranks(self, overall_results: list):
        """Assign school_rank in memory and bulk-update."""
        from collections import defaultdict

        by_school_year: dict = defaultdict(list)
        for ov in overall_results:
            key = (ov.candidate.school_id, ov.examination_year_id)
            by_school_year[key].append(ov)

        to_update = []
        for results in by_school_year.values():
            sorted_r = sorted(results, key=lambda x: (x.total_points or 0), reverse=True)
            for rank, ov in enumerate(sorted_r, start=1):
                ov.school_rank = rank
                to_update.append(ov)

        OverallResult.objects.bulk_update(to_update, ["school_rank"], batch_size=500)

    # ── audit ────────────────────────────────────────────────

    def _seed_audit(self, candidates: list):
        sample = random.sample(candidates, min(200, len(candidates)))

        audit_batch = []
        rq_batch = []
        actions = ["RESULT_VIEW", "RESULT_QUERY", "REGISTRATION_UPDATE", "ADMIN_ACTION"]

        for c in sample:
            audit_batch.append(AuditLog(
                id=uuid.uuid4(),
                action=random.choice(actions),
                actor=random.choice(["admin@knec.ac.ke", "examofficer@knec.ac.ke",
                                     "county.officer@knec.ac.ke", "anonymous"]),
                ip_address=f"197.{random.randint(1,254)}.{random.randint(0,255)}.{random.randint(1,254)}",
                index_number=c.index_number,
                description=f"Auto-generated seed audit entry for {c.full_name}",
                extra_data={"year": c.examination_year.year, "school": c.school.center_code},
                timestamp=timezone.now() - timedelta(days=random.randint(0, 365 * 5)),
            ))

            found = random.random() > 0.05
            rq_batch.append(ResultQuery(
                index_number=c.index_number,
                full_name_provided=c.full_name if found else "WRONG NAME",
                ip_address=f"41.{random.randint(1, 254)}.{random.randint(0,255)}.{random.randint(1,254)}",
                user_agent="Mozilla/5.0 (seed_data)",
                was_found=found,
                queried_at=timezone.now() - timedelta(days=random.randint(0, 365 * 3)),
            ))

        AuditLog.objects.bulk_create(audit_batch, batch_size=200, ignore_conflicts=True)
        ResultQuery.objects.bulk_create(rq_batch, batch_size=200)

        self.stdout.write(f"    {len(audit_batch)} audit logs | {len(rq_batch)} result queries")

    # ── helpers ──────────────────────────────────────────────

    @staticmethod
    def _random_full_name(gender: str) -> str:
        first = random.choice(KENYAN_FIRST_NAMES_M if gender == "M" else KENYAN_FIRST_NAMES_F)
        last  = random.choice(KENYAN_LAST_NAMES)
        return f"{first} {last}"