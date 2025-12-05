
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceTextInput } from '@/components/ui/SafeSpaceTextInput';
import { SafeSpaceText } from '@/components/ui/SafeSpaceText';
import { IconSymbol } from '@/components/IconSymbol';
import { TouchableOpacity } from 'react-native';

export default function AddPersonScreen() {
  const { userId } = useAuth();
  const { theme } = useThemeContext();
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a name');
      return;
    }

    if (!relationshipType.trim()) {
      Alert.alert('Missing Information', 'Please enter a relationship type');
      return;
    }

    setLoading(true);

    try {
      console.log('Creating person:', name, relationshipType);
      const { data, error } = await supabase
        .from('persons')
        .insert([
          {
            user_id: userId,
            name: name.trim(),
            relationship_type: relationshipType.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating person:', error);
        Alert.alert('Error', 'Failed to add person. Please try again.');
      } else {
        console.log('Person created:', data);
        Alert.alert('Success', `${name} has been added to your Safe Space`, [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error('Unexpected error creating person:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeSpaceScreen scrollable={true} keyboardAware={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Add Person</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <SafeSpaceText variant="title" style={styles.title}>
          Who would you like to add?
        </SafeSpaceText>

        <SafeSpaceText variant="body" style={styles.description}>
          Add someone you&apos;d like to talk about in your Safe Space. This could be a friend,
          family member, colleague, or anyone else.
        </SafeSpaceText>

        <View style={styles.form}>
          <SafeSpaceText variant="label" style={styles.label}>
            Name
          </SafeSpaceText>
          <SafeSpaceTextInput
            placeholder="Enter their name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
          />

          <SafeSpaceText variant="label" style={styles.label}>
            Relationship Type
          </SafeSpaceText>
          <SafeSpaceTextInput
            placeholder="e.g., friend, family, colleague"
            value={relationshipType}
            onChangeText={setRelationshipType}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
          />

          <View style={styles.buttonContainer}>
            <SafeSpaceButton onPress={handleSave} loading={loading} disabled={loading}>
              Save Person
            </SafeSpaceButton>
          </View>
        </View>
      </View>
    </SafeSpaceScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 32,
  },
});
