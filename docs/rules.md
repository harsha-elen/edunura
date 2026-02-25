# Development Rules & Guidelines for LMS Project

This document outlines the mandatory rules and best practices for developing and maintaining the LMS application. All AI coding agents, developers, and contributors must adhere to these guidelines to ensure consistency, scalability, and maintainability.

## 1. Global Theming & Branding

### **Rule 1.1: No Hardcoded Primary Colors**
-   **NEVER** hardcode the primary brand color (e.g., `#2b8cee`) directly in components.
-   The application supports dynamic theming. All primary colors must be derived from the global theme provided by `ThemeContext`.
-   **Implementation:**
    -   Import `useTheme` from `@mui/material/styles` or `useThemeContext` from `../context/ThemeContext`.
    -   Use `theme.palette.primary.main` to access the primary color.
    -   Use `theme.palette.primary.dark` or `theme.palette.primary.light` for variations.

### **Rule 1.2: Dynamic Transparency (Alpha Helper)**
-   Do **NOT** use hardcoded RGBA strings like `rgba(43, 140, 238, 0.1)`.
-   Use the `alpha` utility from `@mui/material/styles` to generate transparent shades based on the dynamic primary color.
-   **Example:**
    ```tsx
    import { alpha } from '@mui/material/styles';
    // ...
    bgcolor: alpha(theme.palette.primary.main, 0.1) // Correct
    bgcolor: 'rgba(43, 140, 238, 0.1)' // INCORRECT
    ```

### **Rule 1.3: Text Contrast**
-   Ensure sufficient contrast for text on primary-colored backgrounds.
-   Use `theme.palette.primary.contrastText` or explicitly set color to `white` (`#ffffff`) for text on primary buttons/backgrounds.

## 2. Layout & Structure

### **Rule 2.1: Common Admin Layout**
-   All internal pages in the Admin Portal must use the `AdminLayout` component.
-   **Do NOT** import or re-implement the `Sidebar` or `Header` components inside individual page files (e.g., `Dashboard.tsx`, `Settings.tsx`).
-   The `AdminLayout` (in `App.tsx` or routed layout) handles the navigation wrapper. Individual pages should only render their specific content.

### **Rule 2.2: Component Structure (Frontend)**
-   **UI Library:** Use **Material-UI (MUI)** for all components. Avoid custom CSS files unless necessary for complex animations.
-   **Styling:** Use the `sx` prop for component-level styling.
-   **Icons:** Use `@mui/icons-material`.

## 3. Backend & Data Management

### **Rule 3.1: System Settings via Database**
-   Global configuration (branding colors, limits, feature toggles) must be stored in the `system_settings` table.
-   **Access:**
    -   Backend: Use the `SystemSetting` Sequelize model.
    -   Frontend: Fetch via `GET /api/settings` and use `response.data['key_name']`.
-   **Do NOT** hardcode configuration values in `.env` files if they are meant to be user-configurable globally.

### **Rule 3.2: API Structure**
-   Follow RESTful principles.
-   Routes should be modular (e.g., `routes/settings.ts`, `routes/auth.ts`).
-   Controllers should handle business logic and return standardized JSON responses: `{ status: 'success' | 'error', data: ..., message?: ... }`.

## 4. Coding Standards

### **Rule 4.1: TypeScript Usage**
-   Use explicit typing for props, state, and API responses.
-   Avoid `any` unless absolutely necessary during rapid prototyping (refactor later).
-   Define interfaces for all data models (e.g., `User`, `Course`, `SystemSetting`).

### **Rule 4.2: File Naming**
-   **React Components:** PascalCase (e.g., `Dashboard.tsx`, `UserProfile.tsx`).
-   **Backend Files:** camelCase (e.g., `server.ts`, `authController.ts`) or snake_case for utilities if consistent with existing codebase.

## 5. Agent-Specific Instructions

-   **Context Awareness:** Before creating new files or implementing features, check `ThemeContext` and `AdminLayout` to align with existing patterns.
-   **Verification:** After major refactoring (especially theming), verify that changing the primary color in `Settings` updates ALL components (Sidebar, Dashboard Charts, Buttons) dynamically.
