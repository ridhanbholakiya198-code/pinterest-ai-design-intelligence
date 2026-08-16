import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans selection:bg-neutral-800 selection:text-white">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 px-6 py-4 flex items-center">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-medium text-white mb-6 tracking-tight">Privacy Policy</h1>
          <p className="text-lg text-neutral-400">Effective Date: [Insert Date Before Launch]</p>
        </header>

        <div className="space-y-12 text-base md:text-lg leading-relaxed text-neutral-300">
          <section>
            <h2 className="text-2xl font-medium text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to Pinterest AI Design Intelligence. This Privacy Policy explains how we collect, use, process, and protect your information when you access and use our application. By using our service, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">2. Information We Access</h2>
            <p>
              We access information strictly to provide our core design intelligence services. This includes information retrieved from your connected Pinterest account, usage session data, and the visual assets generated or analyzed during your use of the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">3. Pinterest Account and Pinterest Data</h2>
            <p>
              Upon your explicit OAuth authorization, our application accesses your Pinterest Pins and boards. This access is strictly limited to the permissions you grant during the authorization flow (specifically <code>boards:read</code>, <code>pins:read</code>, and <code>user_accounts:read</code>).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">4. How Pinterest Data Is Used</h2>
            <p>
              We use your Pinterest data exclusively for the application's stated purpose: organizing your saved visual references and generating creative design intelligence, concepts, and related architectural outputs. We do not use your Pinterest data for unrelated advertising, nor do we sell it to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">5. AI / Gemini Processing</h2>
            <p>
              To provide advanced visual analysis and generative design capabilities, relevant data and images from your Pinterest library may be sent to Google's Gemini API for AI analysis and generation when you actively invoke those features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">6. Saved Pins, Boards and Visual Analysis</h2>
            <p>
              Our application analyzes the visual characteristics of your saved Pins and boards to construct a probabilistic "Visual DNA" and aesthetic profile. This analysis is temporarily processed and safely associated with your unique session.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">7. Generated Content</h2>
            <p>
              The design directions, architectural project structures, and generated images produced by our AI tools are based directly on your visual references and explicit prompts. You retain responsibility for the usage and application of the generated outputs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">8. Authentication and OAuth</h2>
            <p>
              We use standard OAuth 2.0 to securely authenticate your Pinterest account. Your raw Pinterest password and login credentials are never visible to, nor stored by, our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">9. Cookies and Session Security</h2>
            <p>
              Your session identifiers and OAuth tokens (such as the <code>access_token</code> and <code>refresh_token</code>) are encrypted and stored securely in <code>HttpOnly</code> signed cookies managed entirely on our server. The frontend application does not have direct access to these sensitive tokens, protecting you from cross-site scripting (XSS) risks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">10. Firebase / Database Storage</h2>
            <p>
              We utilize Google Firebase (Firestore) for database storage to securely persist your processed visual analysis and application state. Strict Firestore security rules are implemented to isolate your data, ensuring it is only accessible to your securely authenticated session ID.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">11. Data Security</h2>
            <p>
              Our server-side architecture is designed to protect your data. Sensitive API credentials (such as our Gemini API key and Pinterest Client Secret) are maintained as secure server-side environment variables and are never exposed to the frontend browser bundle. While we implement strong architectural security practices, no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">12. Data Retention and Deletion</h2>
            <p>
              We retain your data only for as long as necessary to provide the service. To request the complete deletion of your application data and revocation of our access, please contact us using the information provided in the Contact Information section below. We will manually purge your data from our Firestore database and discard any active session tokens.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">13. Third-Party Services</h2>
            <p>
              We integrate with specific third-party service providers (Google Gemini API, Google Firebase, and the Pinterest API) to deliver our core functionality. Their processing of data is subject to their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">14. User Rights / Data Requests</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal data processed by our application. We are committed to honoring these requests promptly upon verification of your identity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">15. Children's Privacy</h2>
            <p>
              Our service is not directed to children under the age of 13, and we do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">16. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or architectural updates. We will notify you of any material changes by updating the Effective Date at the top of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">17. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, your data, or if you wish to submit a data deletion request, please contact us at:
            </p>
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl inline-block">
              <p className="font-medium text-white">
                Email: <a href="mailto:[YOUR_CONTACT_EMAIL_HERE]" className="text-blue-400 hover:text-blue-300 transition-colors">[YOUR_CONTACT_EMAIL_HERE]</a>
              </p>
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              * Note: Please replace this placeholder with your actual contact email address prior to submitting this policy to the Pinterest Developer Console.
            </p>
          </section>
        </div>
      </main>
      
      <footer className="border-t border-neutral-900 py-12 text-center text-sm text-neutral-500 mt-16">
        <p>&copy; {new Date().getFullYear()} Pinterest AI Design Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
}
