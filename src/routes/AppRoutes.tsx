import { Route, Navigate } from "react-router-dom";
import { LegacyToolsRedirect, LegacyAiRedirect, ProtectedRoute, RootRoute } from "./routeHelpers";
import { AnimatedShell } from "./AnimatedShell";
import {
  // chat
  ChatPage,
  SharedChatPage,
  ResearchPreviewPage,
  SlidesPreviewPage,
  SlidesFilePreviewPage,
  DocumentPreviewPage,
  // auth hub
  AuthPage,
  OAuthCallbackPage,
  OAuthAuthorizePage,
  ResetPasswordPage,
  ChangeEmailPage,
  ChangePasswordPage,
  TwoFactorPage,
  MfaChallengePage,
  DeleteAccountPage,
  AcceptInvitePage,
  ReferralRedirectPage,
  // billing hub
  BillingPage,
  BillingSuccessPage,
  ReferralsPage,
  ReferralsDashboardTab,
  ReferralsProgramTab,
  ReferralsTasksTab,
  ReferralsWithdrawalsTab,
  ReferralResourcesPage,
  WithdrawPage,
  // integrations hub
  IntegrationsPage,
  IntegrationDetailPage,
  // settings
  SettingsPage,
  CustomizationPage,
  ProfileEditPage,
  SecuritySettingsPage,
  SecurityPage,
  LanguagePage,
  NotificationsPage,
  McpSettingsPage,
  AIPersonalizationPage,
  MemoryPage,
  ApiKeysPage,
  CostDashboardPage,
  ApprovalsPage,
  DiffPlaygroundPage,
  ScheduledTasksPage,
  MarketplacePage,
  SettingsSupportPage,
  SettingsHelpPage,
  SettingsContactPage,
  SettingsPrivacyPage,
  CapabilitiesPage,
  SystemStatusPage,
  SwitchAccountPage,
  SkillsSettingsPage,
  SkillsNewPage,
  // marketing
  PricingPage,
} from "./lazyPages";

const toChat = <Navigate to="/chat" replace />;
const toPricing = <Navigate to="/pricing" replace />;

/** All application routes. Rendered inside <DeferredRoutes> in App.tsx. */
export const AppRoutes = ({ currentUserId }: { currentUserId: string | null }) => (
  <>
    {/* ── Entry ──────────────────────────────────────────────── */}
    <Route path="/" element={<RootRoute authedElement={<ChatPage key={currentUserId} />} />} />
    <Route path="/chat" element={<ChatPage key={currentUserId} />} />
    <Route path="/index" element={<ChatPage key={currentUserId} />} />
    <Route path="/share/:shareId" element={<SharedChatPage />} />

    {/* ── Auth hub — one page, animated inner views ──────────── */}
    <Route element={<AnimatedShell />}>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signin" element={<AuthPage />} />
      <Route path="/sign-in" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/sign-up" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />
      <Route path="/auth/mfa" element={<MfaChallengePage />} />
      <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
      <Route path="/ref/:code" element={<ReferralRedirectPage />} />
      <Route path="/r/:code" element={<ReferralRedirectPage />} />
      <Route
        path="/settings/change-email"
        element={<ProtectedRoute><ChangeEmailPage /></ProtectedRoute>}
      />
      <Route
        path="/settings/change-password"
        element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>}
      />
      <Route
        path="/settings/two-factor"
        element={<ProtectedRoute><TwoFactorPage /></ProtectedRoute>}
      />
      <Route
        path="/settings/delete-account"
        element={<ProtectedRoute><DeleteAccountPage /></ProtectedRoute>}
      />
    </Route>

    {/* ── Billing hub — one page, animated inner views ───────── */}
    <Route element={<AnimatedShell />}>
      <Route
        path="/settings/billing"
        element={<ProtectedRoute><BillingPage /></ProtectedRoute>}
      />
      <Route path="/billing/success" element={<BillingSuccessPage />} />
      <Route path="/suc" element={<BillingSuccessPage />} />
      <Route
        path="/settings/referrals"
        element={<ProtectedRoute><ReferralsPage /></ProtectedRoute>}
      >
        <Route index element={<ReferralsDashboardTab />} />
        <Route path="program" element={<ReferralsProgramTab />} />
        <Route path="tasks" element={<ReferralsTasksTab />} />
        <Route path="withdrawals" element={<ReferralsWithdrawalsTab />} />
      </Route>
      <Route
        path="/settings/referrals/resources"
        element={<ProtectedRoute><ReferralResourcesPage /></ProtectedRoute>}
      />
      <Route
        path="/settings/withdraw"
        element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>}
      />
    </Route>

    {/* ── Integrations hub — one page, animated inner views ──── */}
    <Route element={<AnimatedShell />}>
      <Route
        path="/settings/integrations"
        element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>}
      />
      <Route
        path="/settings/integrations/:id"
        element={<ProtectedRoute><IntegrationDetailPage /></ProtectedRoute>}
      />
    </Route>

    {/* ── Settings ──────────────────────────────────────────── */}
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/settings/customization" element={<ProtectedRoute><CustomizationPage /></ProtectedRoute>} />
    <Route path="/settings/ai-personalization" element={<ProtectedRoute><AIPersonalizationPage /></ProtectedRoute>} />
    <Route path="/settings/profile" element={<Navigate to="/settings/profile/edit" replace />} />
    <Route path="/settings/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
    <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="/settings/security" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
    <Route path="/settings/language" element={<ProtectedRoute><LanguagePage /></ProtectedRoute>} />
    <Route path="/settings/mcp" element={<ProtectedRoute><McpSettingsPage /></ProtectedRoute>} />
    <Route path="/settings/memory" element={<ProtectedRoute><MemoryPage /></ProtectedRoute>} />
    <Route path="/settings/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
    <Route path="/settings/costs" element={<ProtectedRoute><CostDashboardPage /></ProtectedRoute>} />
    <Route path="/settings/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
    <Route path="/settings/diff" element={<ProtectedRoute><DiffPlaygroundPage /></ProtectedRoute>} />
    <Route path="/settings/tasks" element={<ProtectedRoute><ScheduledTasksPage /></ProtectedRoute>} />
    <Route path="/settings/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
    <Route path="/settings/skills" element={<ProtectedRoute><SkillsSettingsPage /></ProtectedRoute>} />
    <Route path="/settings/skills/new" element={<ProtectedRoute><SkillsNewPage /></ProtectedRoute>} />
    <Route path="/skills" element={<ProtectedRoute><SkillsSettingsPage /></ProtectedRoute>} />
    <Route path="/settings/support" element={<ProtectedRoute><SettingsSupportPage /></ProtectedRoute>} />
    <Route path="/settings/support/help" element={<ProtectedRoute><SettingsHelpPage /></ProtectedRoute>} />
    <Route path="/settings/support/contact" element={<ProtectedRoute><SettingsContactPage /></ProtectedRoute>} />
    <Route path="/settings/privacy" element={<ProtectedRoute><SettingsPrivacyPage /></ProtectedRoute>} />
    <Route path="/settings/capabilities" element={<ProtectedRoute><CapabilitiesPage /></ProtectedRoute>} />
    <Route path="/settings/system-status" element={<ProtectedRoute><SystemStatusPage /></ProtectedRoute>} />
    <Route path="/settings/switch" element={<ProtectedRoute><SwitchAccountPage /></ProtectedRoute>} />

    {/* ── Research previews ─────────────────────────────────── */}
    <Route path="/research/preview/new" element={<ProtectedRoute><ResearchPreviewPage /></ProtectedRoute>} />
    <Route path="/research/preview/:id" element={<ProtectedRoute><ResearchPreviewPage /></ProtectedRoute>} />
    <Route path="/research/share/:token" element={<ResearchPreviewPage />} />

    {/* ── Documents & slides previews ───────────────────────── */}
    <Route path="/slides/preview/:id" element={<SlidesPreviewPage />} />
    <Route path="/slides/file-preview/:id" element={<SlidesFilePreviewPage />} />
    <Route path="/document/:artifactId" element={<DocumentPreviewPage />} />

    {/* ── Retired routes ────────────────────────────────────── */}
    <Route path="/recap" element={<Navigate to="/chat" replace />} />


    {/* ── Pricing (only surviving marketing page) ───────────── */}
    <Route path="/pricing" element={<PricingPage />} />

    {/* ── Security (settings-owned) ─────────────────────────── */}
    <Route path="/security" element={<SecurityPage />} />

    {/* ── Retired marketing / legal pages ───────────────────── */}
    <Route path="/se" element={toChat} />
    <Route path="/status" element={toChat} />
    <Route path="/ai-chat" element={toChat} />
    <Route path="/ai-chat/*" element={toChat} />
    <Route path="/features-guide" element={toChat} />
    <Route path="/megsy-model" element={toChat} />
    <Route path="/megay" element={toChat} />
    <Route path="/docs" element={toChat} />
    <Route path="/docs/*" element={toChat} />
    <Route path="/blog" element={toChat} />
    <Route path="/blog/*" element={toChat} />
    <Route path="/vs/:slug" element={toChat} />
    <Route path="/about" element={toChat} />
    <Route path="/contact" element={toChat} />
    <Route path="/support" element={toChat} />
    <Route path="/enterprise" element={toPricing} />
    <Route path="/egypt" element={toChat} />
    <Route path="/trust" element={toChat} />
    <Route path="/terms" element={toChat} />
    <Route path="/privacy" element={toChat} />
    <Route path="/cookies" element={toChat} />
    <Route path="/refund" element={toChat} />
    <Route path="/policies/*" element={toChat} />
    <Route path="/acceptable-use" element={toChat} />
    <Route path="/legal/*" element={toChat} />


    {/* ── Legacy aliases — everything retired now redirects ──── */}
    <Route path="/landing" element={toChat} />
    <Route path="/home" element={toChat} />
    <Route path="/showcase" element={toChat} />
    <Route path="/welcome" element={toChat} />
    <Route path="/code" element={toChat} />
    <Route path="/build" element={toChat} />
    <Route path="/build/anything" element={toChat} />
    <Route path="/anything" element={toChat} />
    <Route path="/apps" element={toChat} />
    <Route path="/library" element={toChat} />
    <Route path="/learn" element={toChat} />
    <Route path="/agent" element={toChat} />
    <Route path="/agent/devtools" element={toChat} />
    <Route path="/agents/skills" element={<Navigate to="/settings/skills" replace />} />
    <Route path="/agents/skills/new" element={<Navigate to="/settings/skills/new" replace />} />
    <Route path="/settings/traces" element={<Navigate to="/settings/costs" replace />} />
    <Route path="/settings/workspaces" element={<Navigate to="/settings" replace />} />
    <Route path="/settings/workspaces/*" element={<Navigate to="/settings" replace />} />
    <Route path="/workspaces" element={<Navigate to="/settings" replace />} />
    <Route path="/workspaces/*" element={<Navigate to="/settings" replace />} />
    <Route path="/workspace" element={<Navigate to="/settings" replace />} />
    <Route path="/invite/workspace/:token" element={<Navigate to="/settings" replace />} />
    <Route path="/marketing-automation" element={toChat} />
    <Route path="/lithos" element={toChat} />
    <Route path="/x" element={toChat} />
    <Route path="/masr" element={toChat} />
    <Route path="/promo-masr" element={toChat} />
    <Route path="/promo/:code" element={toPricing} />
    <Route path="/eg" element={toChat} />
    <Route path="/eg/*" element={toChat} />
    <Route path="/s/:slug" element={toChat} />
    <Route path="/l/*" element={toPricing} />
    <Route path="/ai/*" element={<LegacyAiRedirect />} />
    <Route path="/tools/*" element={<LegacyToolsRedirect />} />
    <Route path="/landing-gallery" element={toPricing} />
    <Route path="/community" element={toPricing} />
    <Route path="/services" element={toPricing} />
    <Route path="/media" element={toPricing} />
    <Route path="/gallery" element={toPricing} />
    <Route path="/preview/:type" element={toPricing} />
    <Route path="/template/:id" element={toPricing} />
    <Route path="/images/*" element={toPricing} />
    <Route path="/videos/*" element={toPricing} />
    <Route path="/cinema" element={toPricing} />
    <Route path="/cinema/*" element={toPricing} />
    <Route path="/for" element={toPricing} />
    <Route path="/for/*" element={toPricing} />
    <Route path="/compare" element={toPricing} />
    <Route path="/compare/*" element={toPricing} />
    <Route path="/templates" element={toPricing} />
    <Route path="/templates/*" element={toPricing} />
    <Route path="/models" element={toPricing} />
    <Route path="/models/megsy" element={<Navigate to="/megsy-model" replace />} />
    <Route path="/models/megay" element={<Navigate to="/megay" replace />} />
    <Route path="/models/*" element={toPricing} />
    <Route path="/solutions" element={toPricing} />
    <Route path="/solutions/*" element={toPricing} />
    <Route path="/tools" element={toPricing} />
    <Route path="/hub" element={toPricing} />
    <Route path="/seo-hub" element={toPricing} />
    <Route path="/comparison" element={toPricing} />
    <Route path="/plans-models" element={toPricing} />
    <Route path="/megsy" element={<Navigate to="/megsy-model" replace />} />
    <Route path="/megay-3.9" element={<Navigate to="/megay" replace />} />
    <Route path="/features" element={<Navigate to="/features-guide" replace />} />
    <Route path="/compliance" element={<Navigate to="/legal/compliance" replace />} />
    <Route path="/billing" element={<Navigate to="/settings/billing" replace />} />
    <Route path="/billing/referrals" element={<Navigate to="/settings/referrals" replace />} />
    <Route path="/referrals" element={<Navigate to="/settings/referrals" replace />} />
    <Route path="/integrations" element={<Navigate to="/settings/integrations" replace />} />
    <Route path="/integration" element={<Navigate to="/settings/integrations" replace />} />
    <Route path="/settings/help" element={<Navigate to="/settings/support/help" replace />} />
    <Route path="/settings/contact" element={<Navigate to="/settings/support/contact" replace />} />
    <Route path="/settings/switch-account" element={<Navigate to="/settings/switch" replace />} />
    <Route path="/settings/status" element={<Navigate to="/settings/system-status" replace />} />

    {/* ── Anything else lands in the app ───────────────────── */}
    <Route path="*" element={toChat} />
  </>
);
