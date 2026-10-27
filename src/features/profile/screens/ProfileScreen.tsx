import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radii, spacing } from '../../../theme';
import { track, clearAssociate } from '../../../lib/instrumentation';
import { useMemberAccess } from '../../../lib/membership/gate';
import { useEmailVerificationStatus, currentUserHasPassword, signOutCurrentUser } from '../../../lib/auth';
import { connectStrava, disconnectStrava } from '../../../lib/strava';
// API_PARA_PERFIL (notificações, task 9.4a) — ver mensagem do orquestrador no relatório deste agente.
import { useNotificationsPreference } from '../../notifications/hooks/useNotificationsPreference';
import { clearDeviceRegistration } from '../../../lib/push/deviceRegistration';
import type { ProfileStackParamList, RootStackParamList } from '../../../navigation/types';
import { useAssociateId } from '../hooks/useAssociateId';
import { useAssociate } from '../hooks/useAssociate';
import { Avatar } from '../components/Avatar';
import { ListRow, SectionCard, SectionLabel } from '../components/ListRow';
import { MembershipIcon, StravaIcon, BellIcon, LogoutIcon, ChevronIcon } from '../components/icons';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

/**
 * Tela 15 — Perfil. Foto/iniciais, nome, e-mail, selo de associado, seções
 * "Conta" (Assinatura, Strava, Notificações) e "Dados" (Editar dados
 * pessoais, Sair) — tasks 8.1 a 8.5, 8.8, 8.9.
 */
export default function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const associateId = useAssociateId();
  const { associate, isLoading: isAssociateLoading } = useAssociate(associateId);
  const { hasMemberAccess, membershipEnabled } = useMemberAccess();
  // `Paywall` é tela de root, fora de `ProfileStackParamList` — mesmo padrão
  // de BecomeMemberScreen/MembershipBanner/VipHubScreen para navegar até lá.
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { emailVerified, resend } = useEmailVerificationStatus();
  const {
    notificationsEnabled,
    osPermissionDenied,
    setNotificationsEnabled,
    isLoading: isNotificationsLoading,
  } = useNotificationsPreference(associateId);

  const [isStravaBusy, setIsStravaBusy] = useState(false);
  const [stravaMessage, setStravaMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);

  if (!associateId || isAssociateLoading || !associate) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingLabel}>Carregando perfil…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleConnectStrava = async (): Promise<void> => {
    setStravaMessage(null);
    setIsStravaBusy(true);
    try {
      const result = await connectStrava('profile');
      switch (result.status) {
        case 'connected':
          track('strava_connected', { source: 'profile' });
          return;
        case 'authorization_denied':
          // Spec: visitante recusou — não é erro do app, sem mensagem.
          return;
        case 'unavailable_athlete_cap':
        case 'unavailable_not_configured':
          setStravaMessage('A conexão com o Strava está indisponível no momento. Tente de novo mais tarde.');
          return;
        case 'email_required':
          // Não deveria ocorrer em source: 'profile' (sessão já ativa) — tratado por segurança.
          setStravaMessage('Não foi possível conectar ao Strava agora. Tente novamente em instantes.');
          return;
        case 'error':
          setStravaMessage('Não foi possível conectar ao Strava agora. Tente novamente em instantes.');
          return;
      }
    } finally {
      setIsStravaBusy(false);
    }
  };

  const handleDisconnectStrava = async (): Promise<void> => {
    setStravaMessage(null);
    setIsStravaBusy(true);
    try {
      // disconnectStrava só remove o vínculo em `associates` — nunca encerra
      // a sessão Firebase Auth (8.4): quem criou a conta via Strava continua
      // logado depois de desconectar.
      await disconnectStrava(associateId);
      track('strava_disconnected', { source: 'profile' });
    } finally {
      setIsStravaBusy(false);
    }
  };

  const handleResendVerification = async (): Promise<void> => {
    setIsResendingVerification(true);
    try {
      await resend();
      setVerificationResent(true);
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      // Não há sinal direto de "como esta sessão começou" no Perfil — a
      // presença de um provedor `password` (e-mail/senha OU link de
      // e-mail, ver src/lib/auth/setPassword.ts) é o melhor proxy
      // disponível para distinguir 'email' de 'strava' aqui.
      const method = currentUserHasPassword() ? 'email' : 'strava';
      track('logout', { method });
      clearAssociate();
      await clearDeviceRegistration().catch(() => undefined);
      await signOutCurrentUser();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const stravaConnected = associate.strava.connected;
  const stravaSubtitle = stravaConnected
    ? associate.strava.username
      ? `Conectado como ${associate.strava.username}`
      : 'Conectado'
    : 'Não conectado';

  const subscriptionSubtitle = hasMemberAccess ? 'Plano membro · ativo' : 'Plano gratuito';

  // Flag desligada ⇒ `hasMemberAccess` é sempre `true` (gate.ts) e as rotas
  // Paywall/BecomeMember/SubscriptionConfirmed nem existem no grafo
  // (RootNavigator.tsx) — esta condição não navega nesse estado. Só quando a
  // flag está ligada E o associado não é membro existe "acesso ao fluxo de
  // assinatura" (8.2/spec.md "Perfil do plano gratuito"); membro com flag
  // ligada só vê o estado do plano, sem CTA de conversão.
  const canOpenSubscriptionFlow = membershipEnabled && !hasMemberAccess;

  const handleSubscriptionPress = (): void => {
    track('membership_cta_tapped', { source: 'profile' });
    rootNavigation.navigate('Paywall', { source: 'profile' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Avatar name={associate.name} photoUrl={associate.photo_url} size={72} testID="profile-avatar" />
          <View style={styles.headerText}>
            <Text style={styles.name}>{associate.name}</Text>
            <Text style={styles.email}>{associate.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Membro Base Fox</Text>
            </View>
          </View>
        </View>

        {emailVerified === false ? (
          <View style={styles.verificationBanner}>
            <Text style={styles.verificationText}>
              {verificationResent
                ? 'E-mail de verificação reenviado. Confira sua caixa de entrada.'
                : 'Confirme seu e-mail para proteger sua conta.'}
            </Text>
            {!verificationResent ? (
              <Text
                style={styles.verificationAction}
                onPress={isResendingVerification ? undefined : handleResendVerification}
                accessibilityRole="button"
                testID="resend-verification-action"
              >
                {isResendingVerification ? 'Enviando…' : 'Reenviar e-mail'}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionLabel>Conta</SectionLabel>
          <SectionCard>
            <ListRow
              icon={<MembershipIcon />}
              iconBackground={colors.backgroundTint}
              title="Assinatura"
              subtitle={subscriptionSubtitle}
              right={<ChevronIcon />}
              onPress={canOpenSubscriptionFlow ? handleSubscriptionPress : undefined}
              bordered
              testID="profile-row-subscription"
            />
            <ListRow
              icon={<StravaIcon />}
              iconBackground={colors.strava}
              title="Strava"
              subtitle={stravaSubtitle}
              right={
                <Text
                  style={styles.stravaAction}
                  onPress={isStravaBusy ? undefined : stravaConnected ? handleDisconnectStrava : handleConnectStrava}
                  accessibilityRole="button"
                  testID={stravaConnected ? 'profile-strava-disconnect' : 'profile-strava-connect'}
                >
                  {isStravaBusy ? '…' : stravaConnected ? 'Desconectar' : 'Conectar'}
                </Text>
              }
              bordered
              testID="profile-row-strava"
            />
            <ListRow
              icon={<BellIcon />}
              iconBackground={colors.backgroundTint}
              title="Notificações"
              subtitle={
                osPermissionDenied
                  ? 'Ative nas configurações do sistema para receber avisos.'
                  : 'Eventos, parcerias e acessos'
              }
              right={
                <Switch
                  value={notificationsEnabled}
                  disabled={osPermissionDenied || isNotificationsLoading}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.purple }}
                  thumbColor={colors.backgroundWhite}
                  testID="profile-notifications-switch"
                />
              }
              testID="profile-row-notifications"
            />
          </SectionCard>
        </View>

        <View style={styles.section}>
          <SectionLabel>Dados</SectionLabel>
          <SectionCard>
            <ListRow
              title="Editar dados pessoais"
              right={<ChevronIcon />}
              onPress={() => navigation.navigate('EditProfile')}
              bordered
              testID="profile-row-edit"
            />
            <ListRow
              title="Sair"
              titleColor="#C2410C"
              right={<LogoutIcon />}
              onPress={isLoggingOut ? undefined : handleLogout}
              disabled={isLoggingOut}
              testID="profile-row-logout"
            />
          </SectionCard>
        </View>

        {stravaMessage ? (
          <Text style={styles.stravaMessage} accessibilityLiveRegion="polite">
            {stravaMessage}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingLabel: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontFamily: fontFamily.sairaExtraBold,
    fontSize: fontSize.xxl,
    color: colors.backgroundWhite,
  },
  email: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.md,
    color: '#E2D6EC',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.orange,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginTop: spacing.xxs,
  },
  badgeLabel: {
    fontFamily: fontFamily.sairaBold,
    fontSize: fontSize.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.purpleDeep,
  },
  verificationBanner: {
    marginHorizontal: spacing.xxl,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundTint,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  verificationText: {
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.textTertiary,
  },
  verificationAction: {
    fontFamily: fontFamily.barlowBold,
    fontSize: fontSize.base,
    color: colors.purple,
  },
  section: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  stravaAction: {
    fontFamily: fontFamily.barlowSemiBold,
    fontSize: fontSize.md,
    color: colors.purple,
  },
  stravaMessage: {
    marginHorizontal: spacing.xxl,
    fontFamily: fontFamily.barlowMedium,
    fontSize: fontSize.base,
    color: colors.purple,
    backgroundColor: colors.backgroundTint,
    borderRadius: radii.md,
    padding: spacing.md,
  },
});
