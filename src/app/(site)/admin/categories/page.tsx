import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard-shell";
import { SupportTypeEditor } from "@/components/support-type-editor";
import { adminNav } from "../nav";

export const metadata = { title: "Categories · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  await requireAdmin();
  const nav = await adminNav();

  const [supportTypes, locations] = await Promise.all([
    db.supportType.findMany({ orderBy: [{ position: "asc" }, { label: "asc" }] }),
    db.locationArea.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <DashboardShell
      title="Categories"
      subtitle="Support categories are data, not hard-coded strings, so you can adapt them without a deploy."
      nav={nav}
      active="/admin/categories"
    >
      <SupportTypeEditor
        supportTypes={supportTypes.map((t) => ({ slug: t.slug, label: t.label, active: t.active }))}
      />

      <section className="card mt-6 p-6">
        <h2 className="text-[20px]">Locations</h2>
        <p className="mt-2 text-[15px] text-ink-soft">
          Used for location suggestions and map centring. Add more in the
          seed file or through Prisma Studio.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {locations.map((location) => (
            <li key={location.id} className="chip">
              {location.name}
              {location.region ? ` · ${location.region}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
