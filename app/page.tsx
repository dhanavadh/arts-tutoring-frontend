import Link from 'next/link';
import { AppLayout } from '../components/layout/app-layout';
import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';
import { Typewriter } from '../components/ui/typewriter';


export default function Home() {
  
  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="max-w-[1080px] font-thai border-l-2 pl-16 border-neutral-200">
        <div className='flex flex-col my-8 gap-4 justify-start items-start'>
          <p className='text-7xl my-4'>เรียนภาษากับ <br></br> Beam Academy</p>
          <div className="text-5xl font-bold text-amber-600 mb-4 h-8 "> &gt;
            <Typewriter 
              texts={[
                'สอนโดยนิสิตคณะอักษร จุฬาฯ',
                'ควิซพร้อมคำอธิบายอย่างละเอียด',
                'พร้อมปรึกษาฟรี',
                'เลือกเรียนได้หลากหลายภาษา',                
              ]}
              typeSpeed={80}
              deleteSpeed={40}
              delayBetweenTexts={2000}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-start items-start">
          <Link href="/courses">
            <Button size="lg" className="w-full sm:w-auto">
              เริ่มเรียนเลย
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              เข้าสู่ระบบ
            </Button>
          </Link>
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

        {/* Browse Section */}
        <div className="py-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Explore Our Platform
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/courses">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardBody className="text-center p-6">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold mb-2">Browse Courses</h3>
                  <p className="text-gray-600">Discover comprehensive art courses taught by expert instructors</p>
                </CardBody>
              </Card>
            </Link>

            <Link href="/teachers">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardBody className="text-center p-6">
                  <div className="text-4xl mb-4">👩‍🎨</div>
                  <h3 className="text-xl font-semibold mb-2">Meet Our Teachers</h3>
                  <p className="text-gray-600">Connect with talented and experienced art educators</p>
                </CardBody>
              </Card>
            </Link>

            <Link href="/articles">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardBody className="text-center p-6">
                  <div className="text-4xl mb-4">📰</div>
                  <h3 className="text-xl font-semibold mb-2">Read Articles</h3>
                  <p className="text-gray-600">Learn from educational articles and tutorials</p>
                </CardBody>
              </Card>
            </Link>
          </div>
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