"use client";

import AdminPage from "../page";

export default function AdminTabPage() {
  // This page intentionally re-uses the main admin client component.
  // The AdminPage component will read the URL and pick the right tab.
  return <AdminPage />;
}
