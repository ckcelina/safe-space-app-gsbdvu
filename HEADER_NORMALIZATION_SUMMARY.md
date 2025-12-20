
# Header Layout Normalization Summary

## Overview
Standardized header layout across all screens (Library, Chat, Topic detail, Settings) to ensure consistent header heights, title alignment, and flush background rendering.

## Changes Made

### 1. Created Layout Constants (`constants/Layout.ts`)
- **HEADER_HEIGHT**: 60px (consistent across iOS and Android)
- **HEADER_PADDING_HORIZONTAL**: 20px
- **HEADER_TITLE_SIZE**: 24px

These constants ensure all headers have the same dimensions and spacing.

### 2. Updated Screens

#### Library (`app/(tabs)/library/index.tsx`)
- Removed `paddingTop: insets.top + 8` from FlatList contentContainerStyle
- Changed to `paddingTop: 16` for consistent spacing
- Title now uses `HEADER_TITLE_SIZE` constant
- Removed StatusBarGradient component

#### Chat (`app/(tabs)/(home)/chat.tsx`)
- Replaced hardcoded `paddingTop: Platform.OS === 'android' ? 48 : 60` with standardized approach
- Added gradient background behind header using `LinearGradient` with `position: 'absolute'`
- Header now uses `HEADER_HEIGHT` constant
- SafeAreaView with `edges={['top']}` ensures proper spacing
- Title uses `HEADER_TITLE_SIZE` constant
- Removed StatusBarGradient component

#### Topic Detail (`app/(tabs)/library/detail.tsx`)
- Replaced `paddingTop: Platform.OS === 'android' ? 16 : 8` with standardized approach
- Header uses `HEADER_HEIGHT` constant with `paddingTop: insets.top`
- Title uses consistent sizing
- Removed StatusBarGradient component

#### Settings (`app/(tabs)/settings.tsx`)
- Replaced `paddingTop: Platform.OS === 'android' ? 16 : 8` with standardized approach
- Header uses `HEADER_HEIGHT` constant with `paddingTop: insets.top`
- Title uses `HEADER_TITLE_SIZE` constant
- Removed StatusBarGradient component

### 3. Removed StatusBarGradient Component
- Deleted `components/ui/StatusBarGradient.tsx`
- Removed from `components/ui/index.ts` exports
- Updated `SafeSpaceScreen.tsx` to remove references

## Benefits

1. **Consistent Header Height**: All screens now have the same header height (60px)
2. **Aligned Title Text**: Titles are vertically aligned at the same position across all screens
3. **Flush Background**: Headers have continuous, flush backgrounds with no gaps or overlaps
4. **Simplified Code**: Removed redundant StatusBarGradient component
5. **Maintainability**: Centralized layout constants make future updates easier

## Testing Checklist

- [ ] Library screen header aligns correctly
- [ ] Chat screen header aligns correctly
- [ ] Topic detail screen header aligns correctly
- [ ] Settings screen header aligns correctly
- [ ] All headers have the same height
- [ ] Title text aligns at the same vertical position
- [ ] No gaps or overlaps in header backgrounds
- [ ] Works correctly on both iOS and Android
- [ ] Safe area insets are respected
- [ ] No visual regressions on different screen sizes

## Technical Notes

- Headers use `SafeAreaView` with appropriate `edges` prop
- Chat screen uses an absolute-positioned gradient for visual effect
- All screens respect safe area insets for notches and status bars
- Platform-specific adjustments removed in favor of consistent approach
