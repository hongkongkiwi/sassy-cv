# Sassy CV - Self-Hosted Personal CV Platform

**The sassy alternative to SaaS CV platforms.** Take control of your professional presence and host your own beautifully designed CV without relying on expensive third-party services that charge for basic features like CV enhancement or creation tools.

## 🎯 Why Choose Sassy CV Over SaaS CV Platforms?

- **Free Forever**: No subscription fees or premium plans (unlike expensive SaaS alternatives)
- **Full Control**: Own your data and customize everything - no vendor lock-in
- **Professional Design**: Clean, modern layouts that impress recruiters
- **AI-Powered**: Built-in AI tools for content improvement and cover letter generation
- **Analytics**: Track who views your CV and when - features that cost extra elsewhere
- **PDF Export**: Generate professional PDFs instantly - no paywalls
- **LinkedIn Import**: Import your existing LinkedIn profile data
- **Real-time Editing**: Live admin panel for quick updates
- **Self-Hosted**: Your CV, your server, your rules

## ✨ Features

### 🎨 **Beautiful CV Display**
- Modern, responsive design that looks great on all devices
- Professional gradients and typography
- Sticky header with export functionality
- Mobile-optimized layout

### 🛠️ **Admin Dashboard**
Complete control panel for managing your CV:
- Contact information management
- Work experience editor
- Skills organization
- Education details
- Projects showcase
- AI-powered content analysis and suggestions
- Cover letter generator
- Analytics dashboard
- Theme customization

### 🤖 **AI-Powered Features**
- **CV Analysis**: Get AI feedback on your CV content
- **Content Rewriting**: Improve descriptions with AI assistance
- **Cover Letter Generation**: Create tailored cover letters instantly
- **Improvement Suggestions**: Receive actionable recommendations

### 📊 **Analytics & Insights**
- Track CV views and downloads
- Visitor analytics (device type, referrer)
- Export analytics data
- Real-time visitor tracking

### 🔧 **Technical Features**
- PDF export with professional formatting
- LinkedIn profile import
- Real-time data synchronization
- Secure authentication
- Cloud database storage
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- A Convex account (free tier available)
- A Clerk account for authentication (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sassy-cv.git
   cd sassy-cv
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up Convex (Database)**
   ```bash
   npx convex dev
   ```
   - Follow the prompts to create a Convex project
   - Copy your deployment URL

4. **Set up Clerk (Authentication)**
   - Create a Clerk application at [clerk.com](https://clerk.com)
   - Copy your publishable key and secret key

5. **Configure environment variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   CLERK_SECRET_KEY=your-clerk-secret-key
   
   # Optional: AI Provider Keys (for AI features)
   OPENAI_API_KEY=your-openai-key
   GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
   ```

6. **Run the development server**
   ```bash
   pnpm run dev
   # or
   npm run dev
   ```

7. **Visit your CV**
   Open [http://localhost:3000](http://localhost:3000) to see your CV!

## 📝 Configuration

### Initial Setup
1. Sign in using the "Sign In" button
2. Access the Admin panel (⚙️ button)
3. Fill in your contact information
4. Add your work experience, skills, projects, and education
5. Customize your professional summary

### AI Features Setup
To enable AI-powered features, add your API keys to `.env.local`:
- **OpenAI**: For GPT-powered content analysis and generation
- **Google AI**: Alternative AI provider for content enhancement

### LinkedIn Import
Use the LinkedIn import feature in the admin panel to automatically populate your CV with your LinkedIn profile data.

## 🎨 Customization

The CV supports multiple themes and can be customized through:
- **Theme Settings**: Available in the admin panel
- **CSS Customization**: Modify `src/app/globals.css`
- **Component Styling**: Update individual components in `src/components/`

## 📊 Analytics

Track your CV performance:
- **Page Views**: See how many people visit your CV
- **Downloads**: Track PDF downloads
- **Visitor Insights**: Device types, referrers, and timing
- **Export Data**: Download analytics for external analysis

## 🔒 Security & Privacy

- **Authentication**: Secure login with Clerk
- **Data Ownership**: Your data stays in your Convex database
- **Privacy First**: No tracking beyond basic analytics
- **HTTPS Only**: Secure connections in production

## 🚀 Deployment

### 🎯 Primary: Cloudflare Workers (Automated)
This project is configured for **Cloudflare Workers deployment** with automated GitHub Actions.

#### Automated Deployment
Push to `main` branch to trigger automatic deployment:

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CONVEX_DEPLOY_KEY`: Get from `npx convex deploy --print-deploy-key`

#### Manual Deployment
```bash
# Install Wrangler CLI
pnpm add -g wrangler

# Deploy to production
pnpm run deploy

# Deploy to staging
pnpm run deploy:staging
```

### 🔄 GitHub Workflows

This project includes 4 automated workflows:

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`) - Quality checks and triggers deployment
2. **Cloudflare Deploy** (`.github/workflows/cloudflare-deploy.yml`) - Static deployment to Workers  
3. **Convex Deploy** (`.github/workflows/convex-deploy.yml`) - Backend functions deployment
4. **CodeRabbit Reviews** (`.github/workflows/coderabbit.yml`) - AI code reviews

### 🤖 Available Scripts

```bash
# Development
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run build:static     # Build static export for Cloudflare

# Deployment (Primary)
pnpm run deploy           # Deploy to Cloudflare production  
pnpm run deploy:staging   # Deploy to Cloudflare staging

# Convex Backend
pnpm run convex:dev       # Start Convex development
pnpm run convex:deploy    # Deploy Convex functions

# Quality Assurance
pnpm run lint             # Lint code
pnpm run type-check       # TypeScript type checking
```

### 🔷 Alternative: Vercel (Manual Only)
If you prefer Vercel, you can deploy manually:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to production
pnpm run deploy:vercel

# Deploy to staging  
pnpm run deploy:vercel:staging
```

**Note:** Vercel deployment is not automated via GitHub Actions in this setup.

### 🏗️ Other Platforms
This Next.js application can also be deployed to:
- Netlify
- Railway  
- Digital Ocean App Platform
- AWS Amplify

## 🔧 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Convex (serverless)
- **Authentication**: Clerk
- **PDF Generation**: React-PDF
- **AI Integration**: OpenAI & Google AI
- **Analytics**: Custom implementation

## 📖 Usage Examples

### Basic CV Setup
```typescript
// Update your CV data in src/data/cv-data.ts
export const cvData: CVData = {
  contact: {
    name: "Your Name",
    title: "Software Developer",
    email: "your@email.com",
    // ... more fields
  },
  // ... rest of your data
};
```

### Custom Theme
```css
/* Add to globals.css */
:root {
  --primary-color: #your-brand-color;
  --secondary-color: #your-accent-color;
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join conversations in GitHub Discussions
- **Documentation**: Check the wiki for detailed guides

---

**Made with ❤️ for job seekers who are tired of SaaS CV subscription fees.**

*Get sassy with your CV - host it yourself and keep the money in your pocket!*