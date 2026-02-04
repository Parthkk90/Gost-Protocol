import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { WALLET_ADDRESSES } from "../../data/sampleData";

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [developerMode, setDeveloperMode] = useState(false);
  const [faceId, setFaceId] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Wallet Settings"
        showBack
        onBackPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🦄</Text>
            </View>
            <TouchableOpacity style={styles.editBadge}>
              <Ionicons name="pencil" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>Solana Whale</Text>
          <View style={styles.addressChip}>
            <Text style={styles.addressChipText}>{WALLET_ADDRESSES.short}</Text>
            <Ionicons
              name="copy-outline"
              size={14}
              color={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Network Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NETWORK</Text>
          <View style={styles.card}>
            <SettingItem
              icon="globe-outline"
              iconColor="#3b82f6"
              title="Developer Mode"
              subtitle="Enable testnet networks"
              rightComponent={
                <Switch
                  value={developerMode}
                  onValueChange={setDeveloperMode}
                  trackColor={{
                    false: Colors.surfaceDark,
                    true: Colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="server-outline"
              iconColor="#a855f7"
              title="RPC Endpoint"
              subtitle="Mainnet Beta"
              onPress={() => {}}
              showChevron
            />
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <View style={styles.card}>
            <SettingItem
              icon="key-outline"
              iconColor={Colors.error}
              title="Show Private Key"
              titleColor={Colors.error}
              onPress={() => {}}
              showChevron
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-checkmark-outline"
              iconColor={Colors.success}
              title="Trusted Apps"
              onPress={() => {}}
              showChevron
            />
            <View style={styles.divider} />
            <SettingItem
              icon="finger-print-outline"
              iconColor={Colors.textSecondary}
              title="Face ID"
              rightComponent={
                <Switch
                  value={faceId}
                  onValueChange={setFaceId}
                  trackColor={{
                    false: Colors.surfaceDark,
                    true: Colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingItem
              icon="settings-outline"
              iconColor={Colors.textPrimary}
              title="General Settings"
              onPress={() => {}}
              showChevron
            />
            <View style={styles.divider} />
            <SettingItem
              icon="book-outline"
              iconColor="#f97316"
              title="Address Book"
              onPress={() => {}}
              showChevron
            />
            <View style={styles.divider} />
            <SettingItem
              icon="help-circle-outline"
              iconColor="#ec4899"
              title="Support"
              rightIcon="open-outline"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.4 (Build 234)</Text>
          <TouchableOpacity style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface SettingItemProps {
  icon: string;
  iconColor: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  rightIcon?: string;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor,
  title,
  titleColor,
  subtitle,
  onPress,
  rightComponent,
  rightIcon,
  showChevron,
}) => {
  const content = (
    <>
      <View style={styles.settingLeft}>
        <View
          style={[styles.settingIcon, { backgroundColor: `${iconColor}1A` }]}
        >
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.settingInfo}>
          <Text
            style={[styles.settingTitle, titleColor && { color: titleColor }]}
          >
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {rightIcon && (
          <Ionicons
            name={rightIcon as any}
            size={20}
            color={Colors.textSecondary}
          />
        )}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textSecondary}
          />
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.settingItem}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 4,
    borderColor: Colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarEmoji: {
    fontSize: 48,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  addressChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.glassEffect,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  addressChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    fontFamily: "monospace",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  card: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDark,
    marginLeft: 68,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 16,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.error,
  },
});
