# Searchable Cascading Address Fields Implementation Guide

## Overview

This implementation provides searchable dropdown comboboxes for address fields on the shopping cart page with cascading/dependent logic. When users select a country, the province/state options are filtered accordingly, and this cascading behavior continues through city and zipcode fields.

## Features

✅ **Search-as-you-type functionality** - Users can type to filter suggestions  
✅ **Cascading/Dependent fields** - Selection in one field filters downstream fields  
✅ **Multiple countries** - Supports Thailand, USA, UK, Japan, Australia with expandable data  
✅ **Zipcode auto-population** - Zipcodes are suggested based on city selection  
✅ **Disabled state management** - Fields disable when parent fields are empty  
✅ **Reusable component** - SearchableCombobox can be used anywhere  

## Implementation Files

### 1. **SearchableCombobox Component**  
**Location:** `src/components/ui/searchable-combobox.tsx`

A reusable React component that wraps the `cmdk` command library to create a searchable dropdown with:
- Real-time search filtering
- Popover-based UI
- Keyboard navigation support
- Accessible design

**Props:**
```typescript
interface ComboboxProps {
  options: string[];                    // Array of selectable values
  value: string;                        // Currently selected value
  onValueChange: (value: string) => void;  // Callback when selection changes
  placeholder?: string;                 // Button placeholder text
  searchPlaceholder?: string;          // Search input placeholder
  disabled?: boolean;                  // Whether the field is disabled
  emptyMessage?: string;               // Message when no results found
}
```

### 2. **Geographical Data**  
**Location:** `src/data/geographical-data.ts`

Comprehensive hierarchical data structure containing:
- Countries (Thailand, USA, UK, Japan, Australia)
- Provinces/States per country
- Cities/Districts per province
- Zipcodes per city

**Helper Functions:**
```typescript
getCountries(): string[]                                    // Get all countries
getProvinces(country: string): string[]                    // Get provinces for country
getCities(country, province): string[]                     // Get cities for province
getZipcodes(country, province, city): string[]             // Get zipcodes for city
```

### 3. **Updated Cart Page**  
**Location:** `src/components/site/CartPage.tsx`

Key changes:
- Imports new SearchableCombobox component and geographical data helpers
- Removed hardcoded THAI_PROVINCES and THAI_DISTRICTS_BY_PROVINCE constants
- Added cascading state handlers:
  - `handleCountryChange` - Clears dependent fields
  - `handleProvinceChange` - Clears city and zipcode
  - `handleCityChange` - Clears zipcode
- Replaced all address field selects with SearchableCombobox components
- Dynamic options derived from geographical data based on parent selections

## Usage Example

Here's how the cascading logic works in the form:

```typescript
// User selects a country
handleCountryChange("Thailand")
// ↓ Automatically clears province, city, zipcode
// ↓ Province dropdown now shows only Thailand provinces
// ↓ User can search and select "Chiang Mai"

handleProvinceChange("Chiang Mai")
// ↓ Automatically clears city and zipcode  
// ↓ City dropdown shows "Mueang Chiang Mai", "San Sai", "Hang Dong"
// ↓ User searches and selects "Mueang Chiang Mai"

handleCityChange("Mueang Chiang Mai")
// ↓ Automatically clears zipcode
// ↓ Zipcode dropdown shows ["50100", "50101"]
// ↓ User selects a zipcode
```

## Field Dependencies

```
Country (required)
  ↓ Must select Country
  ├─→ Province/State (required if country selected)
  │     ↓ Must select Province
  │     ├─→ City/District (required if province selected)
  │     │     ↓ Must select City
  │     │     ├─→ Zipcode (auto-populated if available)
  │     │     └─→ District/Sub-district (optional text field)
```

## Extending Geographical Data

To add more countries or regions, edit `src/data/geographical-data.ts`:

```typescript
export const GEOGRAPHICAL_DATA: Record<string, GeographicalNode> = {
  // Existing countries...
  "NewCountry": {
    label: "NewCountry",
    children: {
      "Province1": {
        label: "Province1",
        children: {
          "City1": {
            label: "City1",
            zipcodes: ["12345", "12346"],
          },
        },
      },
    },
  },
};
```

## Disabled State Behavior

Fields automatically disable based on their dependencies:

| Field | Disables When |
|-------|---------------|
| Province | Country not selected |
| City | Province not selected |
| Zipcode | City not selected OR no zipcodes available |
| District | Always enabled (optional text field) |

## Keyboard Navigation

Users can interact with dropdowns using:
- **Arrow Keys** - Navigate through options
- **Enter** - Select highlighted option
- **Esc** - Close dropdown
- **Type** - Filter options in real-time

## Mobile Responsive Design

The address section uses `md:grid-cols-2` for a 2-column layout on medium+ screens and single column on mobile, ensuring good UX across all devices.

## Future Enhancements

1. **Add more countries** - Expand GEOGRAPHICAL_DATA with additional countries
2. **API integration** - Load geographical data from an API instead of hardcoding
3. **Zipcode validation** - Add regex patterns to validate zipcode formats per country
4. **Autocomplete address** - Integrate with address validation APIs (e.g., Google Places)
5. **Dynamic load** - Load geographical data on demand for better performance

## Testing

To test the implementation:

1. Navigate to the shopping cart page
2. Try selecting countries - should filter provinces
3. Select a province - should filter cities
4. Select a city - should populate available zipcodes
5. Test search functionality by typing partial names
6. Verify fields disable when dependencies aren't met
7. Test cascading reset (e.g., changing country clears all dependent fields)

## Performance Notes

- Options are memoized using `useMemo` to prevent unnecessary re-renders
- Search filtering is optimized with case-insensitive matching
- No external API calls - all data is local
- Popover-based UI prevents layout shift
