import CreateCourse from '@/components/admin/CreateCourse';

interface EditCoursePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
    const { id } = await params;
    return <CreateCourse editCourseId={id} />;
}
