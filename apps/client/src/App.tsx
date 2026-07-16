import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingPage } from './pages/public/LandingPage';
import { PublicGroupPage } from './pages/public/PublicGroupPage';
import { PublicBadgePage } from './pages/public/PublicBadgePage';
import { MemberProfilePage } from './pages/public/MemberProfilePage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { GroupsPage } from './pages/dashboard/GroupsPage';
import { GroupDetailPage } from './pages/dashboard/GroupDetailPage';
import { GroupMembersPage } from './pages/dashboard/GroupMembersPage';
import { GroupBadgesPage } from './pages/dashboard/GroupBadgesPage';
import { BadgeDetailPage } from './pages/dashboard/BadgeDetailPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ScrollToTop } from './components/common/ScrollToTop';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/groups/:groupId" element={<PublicGroupPage />} />
          <Route path="/badges/:badgeId" element={<PublicBadgePage />} />
          <Route path="/profile/:memberId" element={<MemberProfilePage />} />
        </Route>

        {/* Administration (protected inside DashboardLayout) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:groupId" element={<GroupDetailPage />} />
          <Route path="groups/:groupId/members" element={<GroupMembersPage />} />
          <Route path="groups/:groupId/badges" element={<GroupBadgesPage />} />
          <Route path="badges/:badgeId" element={<BadgeDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
