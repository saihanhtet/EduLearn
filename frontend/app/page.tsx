"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col font-geist">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">EduLearn</h1>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button onClick={() => router.push("/register")}>
              Register
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <header
        className="relative bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white py-36 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/learning-hero.jpg')",
          backgroundPosition: "cover",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bridging the Learning Gap with AI-Powered Education
          </h1>
          <p className="text-lg md:text-xl mb-8">
            EduLearn leverages AI to deliver personalized learning paths in a flexible, hybrid environment for all learners.
          </p>
          <Button
            onClick={() => router.push("/register")}
            className="bg-white text-purple-600 hover:bg-gray-100"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* What We Do Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Learn Smarter with EduLearn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-gray-600">
                EduLearn uses AI to create personalized learning experiences, empowering students, lifelong learners, and educators to achieve their goals through engaging and accessible content.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  AI-Driven Project-Based Learning
                </li>
                <li className="flex items-center">
                  <span className="text-purple-600 mr-2">→</span>
                  Personalized Learning Paths with AI Insights
                </li>
              </ul>
            </div>
            <div className="space-y-4 text-center w-full">
              <div className="p-1 gap-3 space-x-3 grid grid-cols-1 md:grid-cols-3 w-full">
                <div className="p-4 bg-white rounded-lg shadow-md h-full w-full flex flex-col justify-center items-center">
                  <p className="text-2xl font-bold text-purple-600">10%</p>
                  <p className="text-gray-600">Knowledge</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-md h-full w-full flex flex-col justify-center items-center">
                  <p className="text-2xl font-bold text-purple-600">20%</p>
                  <p className="text-gray-600">Skills</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-md h-full w-full flex flex-col justify-center items-center">
                  <p className="text-2xl font-bold text-purple-600">70%</p>
                  <p className="text-gray-600">Practical Application</p>
                </div>
              </div>
              <p className="text-gray-600">
                Progress through a 70:20:10 learning model, enhanced by AI for practical application and skill development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Higher Education Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Higher Education EduLearn
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Comprehensive learning paths for students, powered by AI to personalize your academic journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-600 mb-4">
                For undergraduates and ITE students, EduLearn uses AI to recommend courses and create tailored learning paths based on your academic goals and progress.
              </p>
              <Button variant="link" className="text-purple-600">
                Learn More →
              </Button>
            </div>
            <div className="text-center">
              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                <Image src={"/images/studying-students.png"} alt="Students Studying" width={500} height={500}
                  className="object-cover w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifelong Learning Section */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Lifelong Learning EduLearn
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Continuous learning with AI-driven recommendations to match your interests and goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center">
              <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                <Image src={"/images/life-long-learner.png"} alt="Lifelong Learner" width={500} height={500}
                  className="object-cover w-full h-full" />
              </div>
            </div>
            <div>
              <p className="text-gray-600 mb-4">
                For learners of all ages, EduLearn&apos;s AI analyzes your interests and learning history to suggest courses, certifications, or enrichment programs tailored just for you.
              </p>
              <Button variant="link" className="text-purple-600">
                Explore Certifications →
              </Button>
              <Button variant="link" className="text-purple-600">
                Personal Enrichment →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Borderless Platform Section */}
      <section className="py-16 bg-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Borderless AI-Powered Learning Platform
          </h2>
          <p className="text-center text-gray-200 mb-12">
            We are supported by a globalized coalition of learners, educators, and institutions,
            delivering inclusive AI-enhanced learning opportunities across Asia and beyond.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-4 bg-purple-700 rounded-lg">
              <p className="text-lg font-semibold">Reimagining Higher Education with AI</p>
              <p className="text-gray-300">February 25, 2023</p>
            </div>
            <div className="p-4 bg-purple-700 rounded-lg">
              <p className="text-lg font-semibold">Inclusive AI Learning Programs</p>
              <p className="text-gray-300">January 15, 2023</p>
            </div>
            <div className="p-4 bg-purple-700 rounded-lg">
              <p className="text-lg font-semibold">Expanding Lifelong Learning with AI</p>
              <p className="text-gray-300">December 10, 2022</p>
            </div>
            <div className="p-4 bg-purple-700 rounded-lg">
              <p className="text-lg font-semibold">Inclusive AI-Driven Education</p>
              <p className="text-gray-300">November 5, 2022</p>
            </div>
          </div>
          <div className="text-center mt-8 text-black">
            <Button variant="outline">
              Read More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">EduLearn</h3>
              <p className="text-gray-400">
                Registration No: 3452718218
                <br />
                01 Jan 2025 to 01 Jan 2029
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Higher Education</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Undergraduate Programs</li>
                <li>Certifications</li>
                <li>Diplomas</li>
                <li>AI-Powered Academic Support</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Lifelong Learning</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Personal Enrichment</li>
                <li>Skill Development</li>
                <li>Online Courses</li>
                <li>AI-Driven Recommendations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Educators</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Course Creation Tools</li>
                <li>Student Management</li>
                <li>AI Learning Analytics</li>
                <li>Community Support</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>© 2025 EduLearn Pte Ltd. All rights reserved.</p>
            <p>
              <a href="#" className="hover:underline">Terms & Privacy Policy</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
