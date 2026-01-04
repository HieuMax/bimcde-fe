import { redirect } from "next/navigation";

interface Props {
  params: { projectId: string };
}

export default async function SettingsIndexPage({ params }: Props) {
  // Thay vì quay về trang chủ, hãy đưa họ vào mục cài đặt đầu tiên
  redirect(`/projects/${params.projectId}/settings/details`);
}
