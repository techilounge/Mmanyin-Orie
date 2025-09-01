export default function PrivacyPage() {
    return (
        <>
            <h1>Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <p>
                Mmanyin Orie ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Mmanyin Orie. This service is owned and developed by TechiLounge, a software development company based in Austin, Texas.
            </p>

            <p>
                This Privacy Policy applies to our application, Mmanyin Orie, and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy and our Terms of Service.
            </p>
            
            <h2>Information We Collect</h2>
            <p>We collect information from you when you visit our service, register an account, and use the features of the application. This information includes:</p>
            <ul>
                <li><strong>Personal Identification Information:</strong> Name, email address, phone number, which you provide when you register an account or are invited to a community.</li>
                <li><strong>Community & Family Data:</strong> Information you provide about your community, family structures, members (including names and age groups), and financial contributions.</li>
                <li><strong>Usage Data:</strong> We use Firebase services which may collect information such as your device's Internet Protocol (IP) address, browser type, browser version, the pages of our service that you visit, the time and date of your visit, and other diagnostic data.</li>
                <li><strong>Authentication Data:</strong> We use Firebase Authentication and Google Sign-In to manage user accounts. These services handle your credentials securely. We store your basic profile information, such as your name, email, and photo URL, provided by these services.</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect in various ways, including to:</p>
            <ul>
                <li>Provide, operate, and maintain our Service</li>
                <li>Improve, personalize, and expand our Service</li>
                <li>Understand and analyze how you use our Service</li>
                <li>Process your transactions and manage financial records for your community</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes</li>
                <li>Send you emails, such as invitations to join a community</li>
                <li>Find and prevent fraud</li>
            </ul>
            
            <h2>Data Storage and Security</h2>
            <p>Your data is stored on Google Firebase, a secure platform that provides robust data protection. We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee its absolute security.</p>
            
            <h2>Data Sharing and Disclosure</h2>
            <p>We do not sell, trade, or rent your personal identification information to others. Your data is primarily visible to other members of your specific community within the app, based on the permissions set by your community administrator.</p>
            <p>We may share data with third-party service providers, such as Google (for Firebase and authentication), who perform services on our behalf. These service providers are contractually obligated to protect your data and are prohibited from using it for any other purpose.</p>
            
            <h2>Your Data Protection Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul>
                <li>The right to access – You have the right to request copies of your personal data.</li>
                <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
                <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
                <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.</li>
            </ul>
            <p>To exercise these rights, please contact your community administrator or us directly.</p>

            <h2>Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
            
            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, you can contact us:</p>
            <ul>
                <li>By email: <a href="mailto:privacy@mmanyinorie.com">privacy@mmanyinorie.com</a></li>
                <li>For general support: <a href="mailto:support@mmanyinorie.com">support@mmanyinorie.com</a></li>
            </ul>
        </>
    );
}
