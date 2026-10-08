"""Skill -> course lookup. Checks a small curated static index first (hand-picked, so
always returns the same trusted link for common skills); skills it doesn't cover fall
back to a YouTube Data API v3 search (free tier, no OAuth), cached in-process per skill
so the ~100 searches/day quota is only ever spent once per distinct skill, not once per
request."""

import httpx

from app.config import YOUTUBE_API_KEY

COURSE_INDEX: dict[str, list[dict[str, str]]] = {
    "react": [{"title": "React - The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/"}],
    "react.js": [{"title": "React - The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/"}],
    "javascript": [{"title": "The Complete JavaScript Course", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-javascript-course/"}],
    "javascript es6": [{"title": "The Complete JavaScript Course", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-javascript-course/"}],
    "typescript": [{"title": "Understanding TypeScript", "provider": "Udemy", "url": "https://www.udemy.com/course/understanding-typescript/"}],
    "css": [{"title": "CSS - The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/css-the-complete-guide-incl-flexbox-grid-sass/"}],
    "html": [{"title": "The Web Developer Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/the-web-developer-bootcamp/"}],
    "responsive design": [{"title": "Responsive Web Design", "provider": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/"}],
    "node.js": [{"title": "Node.js, Express, MongoDB & More", "provider": "Udemy", "url": "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/"}],
    "express": [{"title": "Node.js, Express, MongoDB & More", "provider": "Udemy", "url": "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/"}],
    "postgresql": [{"title": "The Complete SQL Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-sql-bootcamp/"}],
    "sql": [{"title": "The Complete SQL Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-sql-bootcamp/"}],
    "rest apis": [{"title": "REST APIs with Flask and Python", "provider": "Udemy", "url": "https://www.udemy.com/course/rest-api-flask-and-python/"}],
    "git": [{"title": "Git & GitHub - The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/git-and-github-bootcamp/"}],
    "mongodb": [{"title": "MongoDB - The Complete Developer's Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/mongodb-the-complete-developers-guide/"}],
    "docker": [{"title": "Docker & Kubernetes: The Practical Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/"}],
    "kubernetes": [{"title": "Docker & Kubernetes: The Practical Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/"}],
    "ci/cd": [{"title": "CI/CD Pipeline with Jenkins", "provider": "Udemy", "url": "https://www.udemy.com/course/cicd-pipeline-using-jenkins-for-devops-engineers/"}],
    "aws": [{"title": "AWS Certified Cloud Practitioner", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/aws-cloud-practitioner"}],
    "linux": [{"title": "Linux Command Line Basics", "provider": "Coursera", "url": "https://www.coursera.org/learn/linux-command-line"}],
    "python": [{"title": "Python for Everybody", "provider": "Coursera", "url": "https://www.coursera.org/specializations/python"}],
    "pytorch": [{"title": "PyTorch for Deep Learning", "provider": "Udemy", "url": "https://www.udemy.com/course/pytorch-for-deep-learning/"}],
    "machine learning": [{"title": "Machine Learning Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/machine-learning-introduction"}],
    "data preprocessing": [{"title": "Data Cleaning", "provider": "Kaggle Learn", "url": "https://www.kaggle.com/learn/data-cleaning"}],
    "statistics": [{"title": "Statistics with Python", "provider": "Coursera", "url": "https://www.coursera.org/specializations/statistics-with-python"}],
    "excel": [{"title": "Excel Skills for Business", "provider": "Coursera", "url": "https://www.coursera.org/specializations/excel"}],
    "data visualization": [{"title": "Data Visualization with Tableau", "provider": "Coursera", "url": "https://www.coursera.org/specializations/data-visualization"}],
    "figma": [{"title": "Figma UI/UX Design Essentials", "provider": "Udemy", "url": "https://www.udemy.com/course/figma-ux-ui-design-user-experience/"}],
    "user research": [{"title": "UX Research at Scale", "provider": "Coursera", "url": "https://www.coursera.org/learn/user-research"}],
    "wireframing": [{"title": "UI/UX Design Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/ui-ux-design"}],
    "prototyping": [{"title": "UI/UX Design Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/ui-ux-design"}],
    "adobe xd": [{"title": "Adobe XD Tutorial", "provider": "YouTube / Adobe", "url": "https://www.adobe.com/products/xd/learn.html"}],
    "manual testing": [{"title": "Software Testing Fundamentals", "provider": "Udemy", "url": "https://www.udemy.com/course/software-testing-fundamentals/"}],
    "test automation": [{"title": "Selenium WebDriver with Java", "provider": "Udemy", "url": "https://www.udemy.com/course/selenium-real-time-examplesinterview-questions/"}],
    "selenium": [{"title": "Selenium WebDriver with Java", "provider": "Udemy", "url": "https://www.udemy.com/course/selenium-real-time-examplesinterview-questions/"}],
    "bug tracking": [{"title": "Jira Fundamentals", "provider": "Atlassian University", "url": "https://university.atlassian.com/"}],
    "communication": [{"title": "Improving Communication Skills", "provider": "Coursera", "url": "https://www.coursera.org/learn/wharton-communication-skills"}],
    "customer service": [{"title": "Customer Service Fundamentals", "provider": "Coursera", "url": "https://www.coursera.org/learn/customer-service-fundamentals"}],
    "ticketing systems": [{"title": "Zendesk Fundamentals", "provider": "Zendesk", "url": "https://training.zendesk.com/"}],
    "patience": [{"title": "Emotional Intelligence at Work", "provider": "Coursera", "url": "https://www.coursera.org/learn/emotional-intelligence-workplace"}],
    "problem solving": [{"title": "Creative Problem Solving", "provider": "Coursera", "url": "https://www.coursera.org/learn/creative-problem-solving"}],
}


_youtube_cache: dict[str, list[dict[str, str]]] = {}


def _search_youtube(skill: str) -> list[dict[str, str]] | None:
    if not YOUTUBE_API_KEY:
        return None
    try:
        response = httpx.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "q": f"{skill} course tutorial",
                "type": "video",
                "maxResults": 3,
                "safeSearch": "strict",
                "key": YOUTUBE_API_KEY,
            },
            timeout=10,
        )
        if response.status_code != 200:
            return None
    except httpx.HTTPError:
        return None

    items = response.json().get("items", [])
    courses = [
        {
            "title": item["snippet"]["title"],
            "provider": item["snippet"]["channelTitle"],
            "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
            "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
            "description": item["snippet"]["description"],
        }
        for item in items
        if item.get("id", {}).get("videoId")
    ]
    return courses or None


def _fallback_search_link(skill: str) -> list[dict[str, str]]:
    return [
        {
            "title": f"Search courses for \"{skill}\"",
            "provider": "Coursera",
            "url": f"https://www.coursera.org/search?query={skill.replace(' ', '%20')}",
        }
    ]


def courses_for_skill(skill: str) -> list[dict[str, str]]:
    key = skill.strip().lower()
    if key in COURSE_INDEX:
        return COURSE_INDEX[key]

    if key in _youtube_cache:
        return _youtube_cache[key]

    courses = _search_youtube(key) or _fallback_search_link(skill)
    _youtube_cache[key] = courses
    return courses
