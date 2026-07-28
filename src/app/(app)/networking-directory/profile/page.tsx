import { requireAttendee } from '@/lib/getCurrentAttendee'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const attendee = await requireAttendee()

  return (
    <ProfileForm
      attendee={{
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        email: attendee.email,
        company: attendee.company,
        position: attendee.position,
        category: attendee.category,
        qrCode: attendee.qrCode ?? null,
        country: attendee.country ?? '',
        bio: attendee.bio ?? '',
        showInDirectory: attendee.showInDirectory ?? true,
        interests: (attendee.interests ?? []).map((i) => i.label).join(', '),
        profileImageUrl:
          typeof attendee.profileImage === 'object' && attendee.profileImage
            ? attendee.profileImage.url ?? null
            : null,
      }}
    />
  )
}
