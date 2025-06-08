import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Message Create",
  description: "Terms and Conditions for using Message Create service.",
};

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Terms & Conditions
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                By accessing and using Message Create ("the Service"), you
                accept and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Message Create is an AI-powered service that helps users create
                personalized wishes for various occasions using advanced natural
                language processing technology.
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>
                  Generate custom wishes for birthdays, holidays, and special
                  occasions
                </li>
                <li>Save and manage your created wishes</li>
                <li>Access premium features through our credit system</li>
                <li>Export and share your wishes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. User Accounts and Registration
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To access certain features of the Service, you must register for
                an account:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>You must provide accurate and complete information</li>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your account
                </li>
                <li>You must be at least 13 years old to create an account</li>
                <li>One account per person; sharing accounts is prohibited</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Payment Terms and Credit System
              </h2>

              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  ⚠️ Critical Payment Notice
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-3">
                  <strong>IMPORTANT:</strong> After completing your purchase on
                  Lemon Squeezy, you MUST click "Continue" or "Return to
                  Merchant" to return to our website. DO NOT use the browser's
                  back button or close the payment window.
                </p>
                <p className="text-red-700 dark:text-red-300">
                  <strong>Failure to complete this step may result in:</strong>
                </p>
                <ul className="list-disc list-inside text-red-700 dark:text-red-300 mt-2 space-y-1">
                  <li>Your order not registering in our system</li>
                  <li>Credits not being added to your account</li>
                  <li>Potential payment processing issues</li>
                </ul>
                <p className="text-red-700 dark:text-red-300 mt-3">
                  If this happens, contact us immediately at{" "}
                  <a
                    href="mailto:login@messagecreate.pro"
                    className="font-semibold underline"
                  >
                    login@messagecreate.pro
                  </a>{" "}
                  with your payment confirmation for assistance.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                General Payment Terms:
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>
                  All payments are processed securely through Lemon Squeezy
                </li>
                <li>Credits are virtual currency used to generate wishes</li>
                <li>Credits do not expire and are non-transferable</li>
                <li>
                  All sales are final - no refunds except as required by law
                </li>
                <li>We reserve the right to modify pricing at any time</li>
                <li>Promotional pricing may be subject to additional terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Refund Policy:
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Due to the digital nature of our service, all sales are
                generally final. However, we may provide refunds at our
                discretion for technical issues that prevent service delivery.
                Refund requests must be submitted within 7 days of purchase.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Acceptable Use Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Generate content that is illegal, harmful, or offensive</li>
                <li>
                  Create wishes containing hate speech, discrimination, or
                  harassment
                </li>
                <li>Attempt to reverse engineer or exploit our AI systems</li>
                <li>Use automated tools to abuse the service</li>
                <li>Share or resell your account access</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Intellectual Property Rights
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Your Content:
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You retain ownership of the wishes you create using our service.
                However, by using the Service, you grant us a limited license to
                store, process, and display your content as necessary to provide
                the service.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Our Content:
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                The Service, including its technology, features, and design, is
                owned by us and protected by copyright, trademark, and other
                intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Service Availability and Limitations
              </h2>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>
                  We strive for 99.9% uptime but cannot guarantee uninterrupted
                  service
                </li>
                <li>
                  Maintenance windows may temporarily limit service availability
                </li>
                <li>
                  AI-generated content quality may vary and is not guaranteed
                </li>
                <li>We may implement rate limiting to ensure fair usage</li>
                <li>
                  Service features may be updated or modified without notice
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Privacy and Data Protection
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your privacy is important to us. Please review our{" "}
                <a
                  href="/privacy"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Privacy Policy
                </a>{" "}
                to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>
                  We provide the service "as is" without warranties of any kind
                </li>
                <li>
                  We are not liable for indirect, incidental, or consequential
                  damages
                </li>
                <li>
                  Our total liability is limited to the amount you paid for the
                  service
                </li>
                <li>
                  We are not responsible for third-party service failures (e.g.,
                  payment processors)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Account Termination
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may terminate or suspend your account at any time for:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Violation of these terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended inactivity (12+ months)</li>
                <li>At our discretion with reasonable notice</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                You may delete your account at any time through your account
                settings. Upon termination, your data will be deleted according
                to our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Changes to Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We reserve the right to modify these terms at any time. Material
                changes will be communicated via email or service notifications.
                Continued use of the service after changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Governing Law and Disputes
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                These terms are governed by applicable international laws. Any
                disputes will be resolved through binding arbitration, except
                where prohibited by local law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                13. Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                For questions about these Terms & Conditions, payment issues, or
                general support:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-white font-medium">
                    <strong>Support Email:</strong>{" "}
                    <a
                      href="mailto:login@messagecreate.pro"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      login@messagecreate.pro
                    </a>
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    <strong>Service:</strong> Message Create
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Response Time:</strong> We aim to respond within
                    24-48 hours
                  </p>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Payment Issues:</strong> If you experience any
                    payment problems or missing credits, please include your
                    payment confirmation number and transaction details in your
                    email.
                  </p>
                </div>
              </div>
            </section>

            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              By using Message Create, you acknowledge that you have read,
              understood, and agree to be bound by these Terms & Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
