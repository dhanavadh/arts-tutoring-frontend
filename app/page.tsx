import Link from 'next/link';
import { AppLayout } from '../components/layout/app-layout';
import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';

export default function Home() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Arts Tutor Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with expert arts teachers, manage your learning journey, and excel in your artistic pursuits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 py-12">
          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold">For Students</h3>
              </div>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-gray-600">
                <li>• Book sessions with expert tutors</li>
                <li>• Take interactive quizzes</li>
                <li>• Read educational articles</li>
                <li>• Track your progress</li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="text-4xl mb-4">👨‍🏫</div>
                <h3 className="text-xl font-semibold">For Teachers</h3>
              </div>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-gray-600">
                <li>• Manage your schedule</li>
                <li>• Create engaging content</li>
                <li>• Design custom quizzes</li>
                <li>• Track student progress</li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold">For Admins</h3>
              </div>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-gray-600">
                <li>• Comprehensive dashboard</li>
                <li>• User management</li>
                <li>• System monitoring</li>
                <li>• Detailed analytics</li>
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 bg-blue-50 rounded-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Join thousands of students and teachers on our platform.
          </p>
          <Link href="/register">
            <Button size="lg">
              Join Now
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}