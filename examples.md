# Mermaid Diagram Examples

## Simple Flowchart
```mermaid
graph TD
    A[Start] --> B{Is it morning?}
    B -->|Yes| C[Drink Coffee]
    B -->|No| D[Drink Water]
    C --> E[Start Work]
    D --> E
    E --> F[End]
```

## Simple Sequence Diagram
```mermaid
sequenceDiagram
    participant User
    participant System
    participant Database
    
    User->>System: Login Request
    System->>Database: Validate Credentials
    Database-->>System: Valid User
    System-->>User: Welcome Message
```

## Complex Flowchart
```mermaid
graph TB
    A[Start] --> B{Is data valid?}
    B -->|Yes| C[Process Data]
    B -->|No| D[Show Error]
    C --> E{Data Type?}
    E -->|Numbers| F[Calculate Average]
    E -->|Text| G[Format Text]
    E -->|Date| H[Sort by Date]
    F --> I[Display Results]
    G --> I
    H --> I
    D --> J[Request New Data]
    J --> B
    I --> K[End]
```

## Tips
- Copy any of these examples into the editor
- Click "Render" to see the diagram
- Modify the code to customize the diagrams
- Use the export buttons to save your work