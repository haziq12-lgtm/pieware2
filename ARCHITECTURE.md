# Pieware 2 Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph "Client Side"
        UI[User Interface]
        HTML[index.html]
        CSS[style.css]
        JS[app.js]
        
        subgraph "Application Sections"
            HOME[Home Section]
            HUB[Project Hub]
            HELPER[Pinout Visualizer]
            SOURCE[Code Generator]
            CALC[Calculator]
            SHOP[Hardware Store]
            FEED[Feedback]
            ABOUT[About]
            ADMIN[Admin Panel]
        end
        
        subgraph "Core Modules"
            NAV[Navigation System]
            THEME[Theme Manager]
            I18N[Internationalization]
            STATE[Global State Management]
            VALID[Validation Engine]
            RENDER[Rendering Engine]
        end
        
        subgraph "Data Models"
            MCU[MCU Database<br/>57 Boards]
            COMP[Component Database<br/>123 Components]
            PROJ[Mini Projects<br/>35 Projects]
            CART[Shopping Cart]
            PROD[Products Catalog]
            ORDERS[Order Management]
        end
    end
    
    subgraph "Backend Services"
        FB[Firebase]
        AUTH[Firebase Auth]
        DB[Realtime Database]
        STORAGE[Firebase Storage]
    end
    
    subgraph "External Services"
        CYTRON[Cytron Store API]
        CHART[Chart.js]
        FONTS[Google Fonts]
    end
    
    UI --> HTML
    UI --> CSS
    UI --> JS
    
    JS --> NAV
    JS --> THEME
    JS --> I18N
    JS --> STATE
    JS --> VALID
    JS --> RENDER
    
    NAV --> HOME
    NAV --> HUB
    NAV --> HELPER
    NAV --> SOURCE
    NAV --> CALC
    NAV --> SHOP
    NAV --> FEED
    NAV --> ABOUT
    NAV --> ADMIN
    
    STATE --> MCU
    STATE --> COMP
    STATE --> PROJ
    STATE --> CART
    STATE --> PROD
    STATE --> ORDERS
    
    RENDER --> MCU
    RENDER --> COMP
    RENDER --> PROJ
    
    HELPER --> VALID
    HELPER --> MCU
    HELPER --> COMP
    
    SHOP --> PROD
    SHOP --> CART
    SHOP --> CYTRON
    
    ADMIN --> AUTH
    ADMIN --> DB
    ADMIN --> ORDERS
    ADMIN --> PROD
    
    JS --> FB
    FB --> AUTH
    FB --> DB
    FB --> STORAGE
    
    JS --> CHART
    HTML --> FONTS
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "User Interactions"
        USER[User Actions]
        NAV_CLICK[Navigation Clicks]
        FORM_INPUT[Form Inputs]
        BTN_CLICK[Button Clicks]
    end
    
    subgraph "Event Handlers"
        ON_NAV[navTo]
        ON_MCU[onMcuChange]
        ON_COMP[onCompChange]
        ON_ADD[addComponent]
        ON_THEME[toggleTheme]
        ON_CART[Cart Operations]
    end
    
    subgraph "State Updates"
        GLOBAL_STATE[Global State]
        HELPER_STATE[Helper State]
        CART_STATE[Cart State]
        THEME_STATE[Theme State]
    end
    
    subgraph "Rendering Pipeline"
        RENDER_FUN[Render Functions]
        DOM_UPDATE[DOM Updates]
        VISUALIZE[Visualizer Render]
    end
    
    subgraph "Data Operations"
        FIREBASE_OPS[Firebase Operations]
        LOCAL_STORAGE[localStorage]
        DATA_MODELS[Data Models]
    end
    
    USER --> NAV_CLICK
    USER --> FORM_INPUT
    USER --> BTN_CLICK
    
    NAV_CLICK --> ON_NAV
    FORM_INPUT --> ON_MCU
    FORM_INPUT --> ON_COMP
    BTN_CLICK --> ON_ADD
    BTN_CLICK --> ON_THEME
    BTN_CLICK --> ON_CART
    
    ON_NAV --> GLOBAL_STATE
    ON_MCU --> HELPER_STATE
    ON_COMP --> HELPER_STATE
    ON_ADD --> HELPER_STATE
    ON_THEME --> THEME_STATE
    ON_CART --> CART_STATE
    
    GLOBAL_STATE --> RENDER_FUN
    HELPER_STATE --> RENDER_FUN
    CART_STATE --> RENDER_FUN
    THEME_STATE --> RENDER_FUN
    
    RENDER_FUN --> DOM_UPDATE
    RENDER_FUN --> VISUALIZE
    
    HELPER_STATE --> DATA_MODELS
    CART_STATE --> FIREBASE_OPS
    THEME_STATE --> LOCAL_STORAGE
    
    FIREBASE_OPS --> DB
    LOCAL_STORAGE --> BROWSER[Browser Storage]
```

## Component Database Structure

```mermaid
graph TB
    subgraph "MCU Database"
        MCU_SERIES[MCU_SERIES Object]
        ARDUINO[Arduino Family]
        ESP[ESP Family]
        PIC[PIC Family]
        MCU_INDEX[MCU_INDEX Lookup]
        WIFI_MCUS[WIFI_MCUS Set]
    end
    
    subgraph "Component Database"
        COMP_CATS[COMPONENT_CATEGORIES]
        SENSORS[Sensors]
        DISPLAYS[Displays]
        COMMS[Communication]
        ACTUATORS[Actuators]
        COMP_INDEX[COMP_INDEX Lookup]
    end
    
    subgraph "Project Database"
        MINI_PROJ[MINI_PROJECTS Array]
        EASY[Easy Projects]
        MEDIUM[Medium Projects]
    end
    
    MCU_SERIES --> ARDUINO
    MCU_SERIES --> ESP
    MCU_SERIES --> PIC
    MCU_SERIES --> MCU_INDEX
    MCU_SERIES --> WIFI_MCUS
    
    COMP_CATS --> SENSORS
    COMP_CATS --> DISPLAYS
    COMP_CATS --> COMMS
    COMP_CATS --> ACTUATORS
    COMP_CATS --> COMP_INDEX
    
    MINI_PROJ --> EASY
    MINI_PROJ --> MEDIUM
```

## Key Module Interactions

```mermaid
sequenceDiagram
    participant User
    participant Navigation
    participant Helper
    participant Validator
    participant Renderer
    participant Firebase
    participant UI
    
    User->>Navigation: Click "Helper" section
    Navigation->>Helper: Initialize helper state
    Helper->>UI: Populate MCU dropdown
    User->>Helper: Select MCU board
    Helper->>Validator: Check board compatibility
    Helper->>UI: Populate component dropdown
    User->>Helper: Add components
    Helper->>Validator: Validate pin assignments
    Validator->>Helper: Return validation results
    Helper->>Renderer: Generate wiring diagram
    Renderer->>UI: Display visualizer
    Helper->>Renderer: Generate source code
    Renderer->>UI: Display code block
    User->>Helper: Save project
    Helper->>Firebase: Store project data
    Firebase->>Helper: Confirm save
    Helper->>UI: Show success message
```

## Firebase Integration

```mermaid
graph TB
    subgraph "Firebase Configuration"
        CONFIG[firebaseConfig]
        APP[firebase.initializeApp]
        DB[firebase.database]
        AUTH[firebase.auth]
    end
    
    subgraph "Database Structure"
        SHOP_PRODUCTS[shopProducts]
        ANNOUNCEMENT[announcement]
        FEEDBACK[feedback]
        ABOUT[about]
        ORDERS[orders]
        ADMIN_EMAILS[adminEmails]
    end
    
    subgraph "Real-time Listeners"
        ON_VALUE[.on('value')]
        PRODUCTS_LISTENER[loadProducts]
        ANNOUNCE_LISTENER[loadAnnouncement]
        FEEDBACK_LISTENER[loadFeedback]
        ABOUT_LISTENER[loadAbout]
    end
    
    subgraph "Operations"
        READ[Read Operations]
        WRITE[Write Operations]
        AUTH_OPS[Auth Operations]
    end
    
    CONFIG --> APP
    APP --> DB
    APP --> AUTH
    
    DB --> SHOP_PRODUCTS
    DB --> ANNOUNCEMENT
    DB --> FEEDBACK
    DB --> ABOUT
    DB --> ORDERS
    DB --> ADMIN_EMAILS
    
    SHOP_PRODUCTS --> ON_VALUE
    ANNOUNCEMENT --> ON_VALUE
    FEEDBACK --> ON_VALUE
    ABOUT --> ON_VALUE
    
    ON_VALUE --> PRODUCTS_LISTENER
    ON_VALUE --> ANNOUNCE_LISTENER
    ON_VALUE --> FEEDBACK_LISTENER
    ON_VALUE --> ABOUT_LISTENER
    
    DB --> READ
    DB --> WRITE
    AUTH --> AUTH_OPS
```

## File Structure

```
pieware 2.0 (gemini)/
├── index.html          # Main HTML structure with all sections
├── app.js             # Core application logic (2776 lines)
├── style.css          # Styling and theming
├── README.md          # Project documentation
├── CHANGELOG.md       # Version history
└── ARCHITECTURE.md    # This architecture diagram
```

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Firebase Realtime Database + Firebase Auth
- **Libraries**: 
  - Firebase SDK (v10.12.2)
  - Chart.js (v4.4.0)
  - Google Fonts
- **Hosting**: Vercel (previously Netlify)
- **Deployment**: Automatic via GitHub

## Core Features Flow

1. **Pinout Visualizer (Helper)**
   - User selects MCU board → Populates component options
   - User adds components → Validates pin assignments
   - System generates wiring diagram + source code
   - Visual feedback for validation warnings

2. **Hardware Store**
   - Products loaded from Firebase
   - Shopping cart managed in local state
   - Orders saved to Firebase database
   - Admin panel for product/order management

3. **Project Hub**
   - Static links to external resources
   - Mini projects database with component mappings
   - One-click load into Helper

4. **Component Dictionary**
   - Searchable database of MCUs and components
   - Category filtering
   - Direct integration with Helper

## Security Considerations

- HTML escaping function `esc()` prevents XSS
- Firebase rules for data access control
- Admin authentication required for sensitive operations
- Affiliate link sanitization

## Performance Optimizations

- Lazy loading for images
- Debounced search inputs
- Efficient DOM updates
- Real-time Firebase listeners with selective updates
- CSS animations with hardware acceleration