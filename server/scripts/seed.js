const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectDb } = require('../src/db');
const { getEnv } = require('../src/utils/env');
const { User } = require('../src/models/User');
const { HeroSlide } = require('../src/models/HeroSlide');
const { Course } = require('../src/models/Course');
const { Lesson } = require('../src/models/Lesson');
const { Quiz, Question } = require('../src/models/Quiz');

async function upsertUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);
  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.passwordHash = passwordHash;
    await existing.save();
    return existing;
  }
  return User.create({ name, email, role, passwordHash });
}

async function main() {
  dotenv.config();
  const env = getEnv();
  await connectDb(env.MONGO_URI);

  const admin = await upsertUser({
    name: 'Admin',
    email: 'admin@lms.local',
    password: 'admin123',
    role: 'admin',
  });

  await upsertUser({
    name: 'Maskiryz',
    email: 'maskiryz23@gmail.com',
    password: 'opet123',
    role: 'admin',
  });

  const teacher = await upsertUser({
    name: 'Teacher',
    email: 'teacher@lms.local',
    password: 'teacher123',
    role: 'teacher',
  });

  await HeroSlide.deleteMany({});
  await HeroSlide.insertMany([
    {
      title: 'Belajar Skill Baru, Setiap Hari',
      subtitle: 'Course singkat + quiz interaktif ala Kahoot/Quizizz.',
      ctaText: 'Lihat Course',
      ctaHref: '/courses',
      imageUrl: '/hero-34.png',
      order: 1,
      isActive: true,
    },
    {
      title: 'Belajar Skill Baru, Setiap Hari',
      subtitle: 'Course singkat + quiz interaktif ala Kahoot/Quizizz.',
      ctaText: 'Lihat Course',
      ctaHref: '/courses',
      imageUrl: '/hero-35.png',
      order: 2,
      isActive: true,
    },
  ]);

  // Create a sample course (owned by teacher)
  const course = await Course.findOneAndUpdate(
    { title: 'React Dasar untuk Pemula' },
    {
      title: 'React Dasar untuk Pemula',
      description: 'Mulai dari component, props, state, sampai bikin mini app.',
      coverImageUrl: '',
      ownerId: teacher._id,
      isPublished: true,
    },
    { upsert: true, new: true }
  );

  await Lesson.deleteMany({ courseId: course._id });
  await Lesson.insertMany([
    {
      courseId: course._id,
      title: '1. Pengenalan React',
      order: 1,
      isPublished: true,
      contentMarkdown:
        '# Pengenalan React\n\nReact adalah library untuk membangun UI.\n\n- Component\n- Props\n- State\n',
    },
    {
      courseId: course._id,
      title: '2. State dan Event',
      order: 2,
      isPublished: true,
      contentMarkdown:
        '# State & Event\n\nGunakan `useState` untuk menyimpan state, dan event handler untuk interaksi.\n',
    },
  ]);

  // Sample quiz
  const quiz = await Quiz.findOneAndUpdate(
    { courseId: course._id, title: 'Quiz Cepat: React Dasar' },
    {
      courseId: course._id,
      title: 'Quiz Cepat: React Dasar',
      description: 'Cek pemahaman kamu.',
      timeLimitSec: 0,
      isPublished: true,
    },
    { upsert: true, new: true }
  );

  await Question.deleteMany({ quizId: quiz._id });
  await Question.insertMany([
    {
      quizId: quiz._id,
      order: 1,
      prompt: 'React itu apa?',
      choices: [
        { id: 'a', text: 'Framework backend' },
        { id: 'b', text: 'Library untuk membangun UI' },
        { id: 'c', text: 'Database' },
      ],
      correctChoiceId: 'b',
    },
    {
      quizId: quiz._id,
      order: 2,
      prompt: 'Hook untuk state di function component?',
      choices: [
        { id: 'a', text: 'useState' },
        { id: 'b', text: 'useFetch' },
        { id: 'c', text: 'useClass' },
      ],
      correctChoiceId: 'a',
    },
  ]);

  // eslint-disable-next-line no-console
  console.log('Seed complete');
  // eslint-disable-next-line no-console
  console.log('Admin: admin@lms.local / admin123');
  // eslint-disable-next-line no-console
  console.log('Teacher: teacher@lms.local / teacher123');
  // eslint-disable-next-line no-console
  console.log('Student: register from UI');

  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
