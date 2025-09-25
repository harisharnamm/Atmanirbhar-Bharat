# Analytics Security

## Password Protection

The analytics dashboard is now protected with a simple password authentication system.

### Default Password
- **Default Password**: `admin123`
- **Location**: `/analytics` page

### Customizing the Password

#### Option 1: Environment Variable (Recommended)
Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_ANALYTICS_PASSWORD=your_secure_password_here
```

#### Option 2: Direct Code Change
Edit `app/analytics/page.tsx` and change the default password:

```typescript
const ANALYTICS_PASSWORD = 'your_secure_password_here'
```

### Security Features

1. **Password Form**: Clean, professional login interface
2. **Error Handling**: Shows "Incorrect password" for wrong attempts
3. **Logout Function**: Easy logout button in the top-right corner
4. **Session Management**: Password persists until logout or page refresh
5. **Environment Support**: Supports both environment variables and hardcoded passwords

### Usage

1. Navigate to `/analytics`
2. Enter the password
3. Click "Access Analytics"
4. Use the "Logout" button to end the session

### Security Notes

- This is a basic client-side password protection
- For production use, consider implementing server-side authentication
- The password is visible in the client-side code if not using environment variables
- For enhanced security, implement proper authentication with JWT tokens or OAuth

### Production Recommendations

For production deployment, consider:
- Server-side authentication
- JWT token-based sessions
- Role-based access control
- Rate limiting for login attempts
- Audit logging for access attempts
