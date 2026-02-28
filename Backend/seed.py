"""
Seed script – run from the Backend directory:
  python seed.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cms.settings')
django.setup()

from cms_app.models import User, Course, Lesson, Enrollment

# ── Instructor accounts ──────────────────────────────────────────────────────
instructor1, _ = User.objects.get_or_create(username='alice_instructor', defaults={
    'email': 'alice@example.com', 'role': 'instructor',
    'first_name': 'Alice', 'last_name': 'Instructor',
})
instructor1.set_password('pass1234')
instructor1.save()

instructor2, _ = User.objects.get_or_create(username='bob_instructor', defaults={
    'email': 'bob@example.com', 'role': 'instructor',
    'first_name': 'Bob', 'last_name': 'Instructor',
})
instructor2.set_password('pass1234')
instructor2.save()

# ── Student accounts ─────────────────────────────────────────────────────────
student, _ = User.objects.get_or_create(username='johndoe', defaults={
    'email': 'johndoe@example.com', 'role': 'student',
    'first_name': 'John', 'last_name': 'Doe',
})
student.set_password('pass1234')
student.save()

# ── Courses & Lessons ────────────────────────────────────────────────────────
courses_data = [
    {
        'title': 'Python for Beginners',
        'description': 'Learn Python from scratch with hands-on projects. '
                       'Covers variables, loops, functions, OOP, and file I/O. '
                       'Perfect for those with no prior programming experience.',
        'instructor': instructor1,
        'lessons': [
            ('Introduction to Python', 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', 45, 1),
            ('Variables and Data Types', 'https://www.youtube.com/watch?v=khKv-8q7YmY', 30, 2),
            ('Control Flow: if/else and loops', 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ', 35, 3),
            ('Functions and Modules', 'https://www.youtube.com/watch?v=9Os0o3wzS_I', 40, 4),
            ('Object-Oriented Programming', 'https://www.youtube.com/watch?v=JeznW_7DlB0', 50, 5),
        ],
    },
    {
        'title': 'React JS – Complete Guide',
        'description': 'Master modern React with hooks, context, routing, and real-world apps. '
                       'Build full-stack-ready frontend applications from scratch.',
        'instructor': instructor1,
        'lessons': [
            ('JSX and Components', 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', 40, 1),
            ('useState and useEffect', 'https://www.youtube.com/watch?v=O6P86uwfdR0', 45, 2),
            ('React Router', 'https://www.youtube.com/watch?v=Law7wfdg_ls', 35, 3),
            ('Context API', 'https://www.youtube.com/watch?v=35lXWvCuM8o', 30, 4),
            ('Fetching Data with Axios', 'https://www.youtube.com/watch?v=qM3K97c_kGE', 38, 5),
        ],
    },
    {
        'title': 'Django REST Framework',
        'description': 'Build robust REST APIs with Django. Covers serializers, viewsets, '
                       'authentication (JWT), permissions, and pagination.',
        'instructor': instructor2,
        'lessons': [
            ('Django Project Setup', 'https://www.youtube.com/watch?v=t-oiI5TUaFQ', 30, 1),
            ('Models and Migrations', 'https://www.youtube.com/watch?v=rHux0gMZ3Eg', 35, 2),
            ('Serializers', 'https://www.youtube.com/watch?v=63zgyrnN7ew', 40, 3),
            ('Views and URL Routing', 'https://www.youtube.com/watch?v=Ux8wUOJzSfA', 45, 4),
            ('JWT Authentication', 'https://www.youtube.com/watch?v=PUzgZrS_piQ', 50, 5),
        ],
    },
    {
        'title': 'Full-Stack Web Development',
        'description': 'Comprehensive full-stack course covering HTML, CSS, JavaScript, '
                       'React, Node.js, and databases. Go from zero to full-stack developer.',
        'instructor': instructor2,
        'lessons': [
            ('HTML5 & CSS3 Basics', 'https://www.youtube.com/watch?v=UB1O30fR-EE', 50, 1),
            ('JavaScript Fundamentals', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 60, 2),
            ('Responsive Design', 'https://www.youtube.com/watch?v=srvUrASNj0s', 40, 3),
            ('Node.js & Express', 'https://www.youtube.com/watch?v=Oe421EPjeBE', 55, 4),
        ],
    },
    {
        'title': 'Data Science with Python',
        'description': 'Learn NumPy, Pandas, Matplotlib and Scikit-Learn for data analysis '
                       'and machine learning. Become a data scientist from scratch.',
        'instructor': instructor1,
        'lessons': [
            ('NumPy Essentials', 'https://www.youtube.com/watch?v=8JfDAm9y_7s', 45, 1),
            ('Pandas for Data Analysis', 'https://www.youtube.com/watch?v=vmEHCJofslg', 50, 2),
            ('Data Visualization', 'https://www.youtube.com/watch?v=3Xc3CA655Y4', 40, 3),
            ('Machine Learning Intro', 'https://www.youtube.com/watch?v=7eh4d6sabA0', 60, 4),
        ],
    },
    {
        'title': 'DevOps & Docker Fundamentals',
        'description': 'Understand CI/CD, containerisation with Docker, Docker Compose, '
                       'and deploying apps to production.',
        'instructor': instructor2,
        'lessons': [
            ('What is DevOps?', 'https://www.youtube.com/watch?v=Xrgk023l4lI', 25, 1),
            ('Docker Basics', 'https://www.youtube.com/watch?v=fqMOX6JJhGo', 50, 2),
            ('Docker Compose', 'https://www.youtube.com/watch?v=HG6yIjZapSA', 40, 3),
            ('CI/CD with GitHub Actions', 'https://www.youtube.com/watch?v=R8_veQiYBjI', 45, 4),
        ],
    },
]

for cd in courses_data:
    course, created = Course.objects.get_or_create(
        title=cd['title'],
        defaults={'description': cd['description'], 'instructor': cd['instructor']},
    )
    if created:
        for title, url, duration, order in cd['lessons']:
            Lesson.objects.create(course=course, title=title, video_url=url,
                                  duration=duration, order=order)
        print(f"  Created: {course.title}")
    else:
        print(f"  Exists:  {course.title}")

# ── Enroll johndoe in first two courses ──────────────────────────────────────
for course in Course.objects.all()[:2]:
    Enrollment.objects.get_or_create(student=student, course=course)

print("\nSeeding complete!")
print("  Instructors : alice_instructor / bob_instructor  (password: pass1234)")
print("  Student     : johndoe                            (password: pass1234)")
