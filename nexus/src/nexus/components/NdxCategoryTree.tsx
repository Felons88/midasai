// src/nexus/components/NdxCategoryTree.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NdxCategoryTreeProps {
  categories: NdxCategory[];
  onCategorySelect?: (category: NdxCategory) => void;
  expanded?: boolean;
}

interface NdxCategory {
  id: string;
  name: string;
  type: 'skill' | 'model' | 'workflow' | 'agent';
  path: string;
  count: number;
  children?: NdxCategory[];
}

export default function NdxCategoryTree({ categories, onCategorySelect, expanded = false }: NdxCategoryTreeProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const renderCategory = (category: NdxCategory, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;

    return (
      <View key={category.id} style={styles.categoryContainer}>
        <TouchableOpacity
          style={[styles.categoryRow, { paddingLeft: depth * 20 }]}
          onPress={() => {
            if (hasChildren) {
              setIsExpanded(!isExpanded);
            }
            onCategorySelect?.(category);
          }}
        >
          <View style={[styles.typeIndicator, styles[`type_${category.type}`]]} />
          <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
          <Text style={styles.countText}>({category.count})</Text>
        </TouchableOpacity>
        {hasChildren && isExpanded && (
          <View style={styles.childrenContainer}>
            {category.children?.map(child => renderCategory(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {categories.map(category => renderCategory(category))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryContainer: {
    marginVertical: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  type_skill: {
    backgroundColor: '#667eea',
  },
  type_model: {
    backgroundColor: '#f093fb',
  },
  type_workflow: {
    backgroundColor: '#4facfe',
  },
  type_agent: {
    backgroundColor: '#43e97b',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  countText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  childrenContainer: {
    marginTop: 4,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
});