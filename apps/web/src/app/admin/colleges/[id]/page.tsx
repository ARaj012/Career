import ResourceEditor from '@/components/admin/ResourceEditor'
import UpdateCollegeButton from '@/components/admin/UpdateCollegeButton'

export default async function EditCollegePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <UpdateCollegeButton collegeId={id} />
      <ResourceEditor resource="colleges" id={id} />
    </>
  )
}
