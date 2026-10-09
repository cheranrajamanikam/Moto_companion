import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const syed = path.resolve(root, "..", "syed", "moto-connect", "src");

function fixSyedContent(content, isComponent = false) {
  let s = content;
  s = s.replace(/from ['"]react-router-dom['"]/g, 'from "@tanstack/react-router"');
  s = s.replace(/from ['"]\.\.\/types['"]/g, 'from "@/types/rider"');
  s = s.replace(/from ['"]\.\.\/data\/mockData['"]/g, 'from "@/data/mockData"');
  s = s.replace(/from ['"]\.\.\/services\/(\w+)['"]/g, 'from "@/services/$1"');
  s = s.replace(/from ['"]\.\.\/components\/Badge['"]/g, 'from "@/components/matching/RiderBadge"');
  s = s.replace(/from ['"]\.\.\/components\/(\w+)['"]/g, 'from "@/components/matching/$1"');
  if (isComponent) {
    s = s.replace(/from ['"]\.\/Badge['"]/g, 'from "./RiderBadge"');
  }
  s = s.replace(/\{ Badge \}/g, "{ RiderBadge }");
  s = s.replace(/<Badge /g, "<RiderBadge ");
  s = s.replace(/<\/Badge>/g, "</RiderBadge>");
  s = s.replace(/navigate\(['"]\/find-rider['"]\)/g, 'navigate({ to: "/match" })');
  s = s.replace(/navigate\(['"]\/find-pillion['"]\)/g, 'navigate({ to: "/match-pillion" })');
  s = s.replace(/navigate\(['"]\/requests['"]\)/g, 'navigate({ to: "/ride-requests" })');
  s = s.replace(/navigate\(['"]\/dashboard['"]\)/g, 'navigate({ to: "/dashboard" })');
  s = s.replace(/navigate\(['"]\/kyc['"]\)/g, 'navigate({ to: "/kyc" })');
  s = s.replace(/navigate\(['"]\/rides['"]\)/g, 'navigate({ to: "/rides" })');
  s = s.replace(/navigate\(['"]\/bikes['"]\)/g, 'navigate({ to: "/bikes" })');
  s = s.replace(/navigate\(['"]\/preferences['"]\)/g, 'navigate({ to: "/preferences" })');
  s = s.replace(/navigate\(['"]\/community['"]\)/g, 'navigate({ to: "/community" })');
  s = s.replace(/navigate\(['"]\/events['"]\)/g, 'navigate({ to: "/events" })');
  s = s.replace(/navigate\(['"]\/shop['"]\)/g, 'navigate({ to: "/shop" })');
  s = s.replace(/navigate\(['"]\/sos['"]\)/g, 'navigate({ to: "/safety" })');
  s = s.replace(/navigate\(`\/profile\/\$\{([^}]+)\}`\)/g, 'navigate({ to: "/profile", search: { userId: String($1) } })');
  s = s.replace(/navigate\(`\/rides\/\$\{([^}]+)\}`\)/g, 'navigate({ to: "/rides", search: { highlight: String($1) } })');
  s = s.replace(/navigate\(`\/matches\/\$\{([^}]+)\}`\)/g, 'navigate({ to: "/match", search: { matchId: String($1) } })');
  s = s.replace(/navigate\(`\/chat\/\$\{([^}]+)\}`\)/g, 'navigate({ to: "/chat" })');
  s = s.replace(/navigate\(`\/route-intelligence\/\$\{([^}]+)\}`\)/g, 'navigate({ to: "/ai-companion" })');
  s = s.replace(/navigate\(`\/companion\/\$\{([^}]+)\}`\)/g, 'navigate({ to: "/ai-companion" })');
  s = s.replace(/navigate\(-1\)/g, "window.history.back()");
  return s;
}

function stripExports(body) {
  return body
    .replace(/export const \w+: React\.FC<FindMatchesPageProps> = \(\{ role \}\) => \{/, "function PageInner({ role }: { role: 'rider' | 'pillion' }) {")
    .replace(/interface FindMatchesPageProps[\s\S]*?\}\n\n/, "")
    .replace(/export const \w+: React\.FC = \(\) => \{/, "function PageInner() {")
    .replace(/export default \w+;\s*$/, "");
}

function extractImportsAndBody(src) {
  const fixed = fixSyedContent(src);
  let remaining = fixed;
  const importParts = [];
  while (true) {
    const m = remaining.match(/^import\s[\s\S]*?;\n/);
    if (!m) break;
    importParts.push(m[0]);
    remaining = remaining.slice(m[0].length);
  }
  let body = remaining.trim();
  body = stripExports(body);
  return { imports: importParts.join(""), body };
}

// types, data, services, components (same as before)
fs.mkdirSync(path.join(root, "src/types"), { recursive: true });
fs.copyFileSync(path.join(syed, "types/index.ts"), path.join(root, "src/types/rider.ts"));

fs.mkdirSync(path.join(root, "src/data"), { recursive: true });
let mock = fs.readFileSync(path.join(syed, "data/mockData.ts"), "utf8");
mock = mock.replace(/from ['"]\.\.\/types['"]/g, 'from "@/types/rider"');
fs.writeFileSync(path.join(root, "src/data/mockData.ts"), mock);

const services = [
  "userService", "matchingService", "kycService", "bikeService",
  "rideService", "requestService", "notificationService",
];
fs.mkdirSync(path.join(root, "src/services"), { recursive: true });
for (const svc of services) {
  fs.writeFileSync(path.join(root, `src/services/${svc}.ts`), fixSyedContent(fs.readFileSync(path.join(syed, `services/${svc}.ts`), "utf8")));
}

const componentMap = { Badge: "RiderBadge.tsx" };
fs.mkdirSync(path.join(root, "src/components/matching"), { recursive: true });
for (const file of fs.readdirSync(path.join(syed, "components")).filter((f) => f.endsWith(".tsx") && f !== "Navbar.tsx")) {
  const base = file.replace(".tsx", "");
  const outName = componentMap[base] || file;
  let c = fixSyedContent(fs.readFileSync(path.join(syed, "components", file), "utf8"), true);
  c = c.replace(/from ['"]\.\/(\w+)['"]/g, (m, name) => {
    if (name === "Badge") return 'from "./RiderBadge"';
    return m;
  });
  fs.writeFileSync(path.join(root, "src/components/matching", outName), c);
}

fs.mkdirSync(path.join(root, "src/styles"), { recursive: true });
const matchingCss = fs.readFileSync(path.join(syed, "index.css"), "utf8");
const glassBlock = matchingCss.match(/\/\* Glassmorphism[\s\S]*$/);
if (glassBlock) fs.writeFileSync(path.join(root, "src/styles/matching.css"), glassBlock[0]);

const routes = [
  { file: "dashboard.tsx", route: "/_authenticated/dashboard", title: "Dashboard", page: "DashboardPage.tsx" },
  { file: "kyc.tsx", route: "/_authenticated/kyc", title: "KYC Verification", page: "KYCPage.tsx" },
  { file: "match.tsx", route: "/_authenticated/match", title: "Find Ride Match", page: "FindMatchesPage.tsx", usage: '<PageInner role="rider" />' },
  { file: "match-pillion.tsx", route: "/_authenticated/match-pillion", title: "Find Pillion", page: "FindMatchesPage.tsx", usage: '<PageInner role="pillion" />' },
  { file: "profile.tsx", route: "/_authenticated/profile", title: "My Profile", page: "UserProfilePage.tsx" },
  { file: "bikes.tsx", route: "/_authenticated/bikes", title: "My Bike Garage", page: "BikesPage.tsx" },
  { file: "notifications.tsx", route: "/_authenticated/notifications", title: "Notifications", page: "NotificationsPage.tsx" },
  { file: "rides.tsx", route: "/_authenticated/rides", title: "My Rides", page: "RidesPage.tsx" },
  { file: "ride-requests.tsx", route: "/_authenticated/ride-requests", title: "Ride Requests", page: "RideRequestsPage.tsx" },
  { file: "preferences.tsx", route: "/_authenticated/preferences", title: "Ride Preferences", page: "PreferencesPage.tsx" },
];

const routesDir = path.join(root, "src/routes/_authenticated");
for (const r of routes) {
  const src = fs.readFileSync(path.join(syed, "pages", r.page), "utf8");
  let { imports, body } = extractImportsAndBody(src);
  const isProfile = r.page === "UserProfilePage.tsx";
  if (isProfile) {
    body = body.replace(
      "const { userId } = useParams<{ userId: string }>();",
      "const { userId } = Route.useSearch();",
    );
    imports = imports.replace(/useParams,?\s*/g, "").replace(/,\s*useNavigate/g, "useNavigate");
  }
  imports = imports.replace(/import React[^\n]*\n/, "");
  if (body.includes("useState") && !imports.includes("useState")) {
    imports = `import { useState, useEffect } from "react";\n` + imports;
  } else if (body.includes("useEffect") && !imports.includes("useEffect")) {
    imports = `import { useEffect } from "react";\n` + imports;
  }
  const usage = r.usage ?? "<PageInner />";
  const searchValidate = isProfile
    ? `
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
  }),`
    : "";
  const fileContent = `import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
${imports}
export const Route = createFileRoute("${r.route}")({${searchValidate}
  head: () => ({
    meta: [{ title: "${r.title} — MotoCompanion" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppShell title="${r.title}">
      ${usage}
    </AppShell>
  );
}

${body}
`;
  fs.writeFileSync(path.join(routesDir, r.file), fileContent);
}

console.log("Syed integration complete");
