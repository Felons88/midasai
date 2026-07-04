// src/nexus/components/NdxDirectoryCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NdxDirectoryCardProps {
  id: string;
  name: string;
  type: 'skill' | 'model' | 'workflow' | 'agent';
  path: string;
  createdAt: Date;
}

export default function NdxDirectoryCard({ id, name, type, path, createdAt }: NdxDirectoryCardProps) {
  const getGradientColors = () => {
    const gradients = {
      skill: ['#667eea', '#764ba2'],
      model: ['#f093fb', '#f5576c'],
      workflow: ['#4facfe', '#00f2fe'],
      agent: ['#43e97b', '#38f9d7']
    };
    return gradients[type] || gradients.skill;
  };

  const getIcon = () => {
    const icons = {
      skill: '🧠',
      model: '🤖',
      workflow: '🔄',
      agent: '⚡'
    };
    return icons[type];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <Text style={styles.path} numberOfLines={3}>{path}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{type.toUpperCase()}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    margin: 8,
    minWidth: 200,
    height: 200,
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  path: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});