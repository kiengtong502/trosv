import { MessagesEmptyPane } from "@/features/messaging/components/MessagesEmptyPane";
import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { AppShell } from "@/app/shell";
import { PageFallback } from "@/app/PageFallback";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { ProtectedRoute } from "@/app/ProtectedRoute";

/* Route-level code splitting: each screen is its own chunk; Leaflet stays
   in the map chunk (see vite manualChunks) and is only pulled by the two
   screens that render one. */
const Home = lazy(() => import("@/features/home/pages/Home"));
const Search = lazy(() => import("@/features/search/pages/Search"));
const RoomDetail = lazy(() => import("@/features/room/pages/RoomDetail"));
const Favorites = lazy(() => import("@/features/favorites/pages/Favorites"));
const Messages = lazy(() => import("@/features/messaging/pages/Messages"));
const ConversationDetail = lazy(() => import("@/features/messaging/pages/ConversationDetail"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const Register = lazy(() => import("@/features/auth/pages/Register"));
const Profile = lazy(() => import("@/features/profile/pages/Profile"));
const StudentPublic = lazy(() => import("@/features/profile/pages/StudentPublic"));
const AiRoommates = lazy(() => import("@/features/ai/pages/AiRoommates"));
const AiAreaSuggestions = lazy(() => import("@/features/ai/pages/AiAreaSuggestions"));
const LandlordDashboard = lazy(() => import("@/features/landlord/pages/LandlordDashboard"));
const LandlordForm = lazy(() => import("@/features/landlord/pages/LandlordForm"));
const NotFound = lazy(() => import("@/app/NotFound"));

/* AppShell renders <Outlet/> itself; the Suspense boundary lives inside
   the shell (see app/shell.tsx <Outlet/> wrapper). */
function ShellWithoutFooter() {
  return (
    <AppShell
      hideFooter
      screenSuspense={
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      }
    />
  );
}

function ShellWithFooter() {
  return (
    <AppShell
      screenSuspense={
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      }
    />
  );
}

export const router = createBrowserRouter([
  /* Standalone auth pages (Zillow pattern): no header, rail or footer —
     just the centered panel. */
  { path: ROUTES.LOGIN, element: <Login /> },
  { path: ROUTES.REGISTER, element: <Register /> },
  {
    /* Search, messages & AI pages have no footer (SPEC). */
    element: <ShellWithoutFooter />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: ROUTES.ROOMS, element: <Search /> },
      { path: "/map", element: <Navigate to={ROUTES.ROOMS} replace /> },
      /* Messages + thread render their own signed-out gate (SPEC) instead
         of a login redirect, so they stay outside ProtectedRoute. */
      {
        path: ROUTES.MESSAGES,
        element: <Messages />,
        children: [
          {
            index: true,
            element: <MessagesEmptyPane />,
          },
          { path: ":id", element: <ConversationDetail /> },
        ],
      },
      {
        path: ROUTES.AI_ROOMMATES,
        element: (
          <ProtectedRoute roles={["student"]}>
            <AiRoommates />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.AI_AREA_SUGGESTIONS,
        element: (
          <ProtectedRoute roles={["student"]}>
            <AiAreaSuggestions />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <ShellWithFooter />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: ROUTES.HOME, element: <Home /> },
      { path: ROUTES.ROOM_DETAIL, element: <RoomDetail /> },
      { path: ROUTES.FAVORITES, element: <Favorites /> },
      {
        path: ROUTES.PROFILE,
        element: (
          <ProtectedRoute roles={["student", "landlord"]}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      { path: ROUTES.STUDENT_PUBLIC, element: <StudentPublic /> },
      {
        path: ROUTES.LANDLORD,
        element: (
          <ProtectedRoute roles={["landlord"]}>
            <LandlordDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.LANDLORD_NEW,
        element: (
          <ProtectedRoute roles={["landlord"]}>
            <LandlordForm />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.LANDLORD_EDIT,
        element: (
          <ProtectedRoute roles={["landlord"]}>
            <LandlordForm />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
