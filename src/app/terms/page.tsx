export default function TermsPage() {
    return (
      <>
        <h1>Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Mmanyin Orie application (the "Service") operated by TechiLounge ("us", "we", or "our").</p>
        
        <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>
        
        <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>

        <h2>1. Accounts</h2>
        <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
        <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service (like Google Sign-In).</p>
        <p>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

        <h2>2. User Conduct and Responsibilities</h2>
        <p>You are solely responsible for the content you post, upload, or otherwise make available on the Service ("User Content"). You agree not to use the Service to:</p>
        <ul>
            <li>Post any information that is abusive, threatening, obscene, defamatory, libelous, or racially, sexually, religiously, or otherwise objectionable and offensive.</li>
            <li>Violate any applicable local, state, national, or international law.</li>
            <li>Infringe on the rights of any third party, including intellectual property rights.</li>
        </ul>
        <p>We reserve the right, but are not obligated, to remove or edit User Content that we determine in our sole discretion violates these Terms.</p>

        <h2>3. Content Ownership</h2>
        <p>You retain all of your ownership rights to your User Content. We do not claim ownership over your data. By submitting User Content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, store, reproduce, and display such content solely for the purpose of operating and providing the Service to you and your community.</p>

        <h2>4. Termination</h2>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may do so by contacting your community administrator or by using the account deletion feature in your profile settings.</p>

        <h2>5. Disclaimer of Warranties</h2>
        <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>
        <p>TechiLounge, its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.</p>

        <h2>6. Limitation of Liability</h2>
        <p>In no event shall TechiLounge, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>

        <h2>7. Governing Law</h2>
        <p>These Terms shall be governed and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions.</p>
        
        <h2>8. Changes</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
        
        <h2>Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us:</p>
        <ul>
            <li>By email: <a href="mailto:legal@mmanyinorie.com">legal@mmanyinorie.com</a></li>
            <li>For general support: <a href="mailto:support@mmanyinorie.com">support@mmanyinorie.com</a></li>
        </ul>
      </>
    );
}
