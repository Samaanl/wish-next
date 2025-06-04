import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Wish Generator",
  description:
    "Privacy Policy for Wish Generator - How we collect, use, and protect your data.",
};

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Information We Collect
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We collect information you provide directly to us, such as when
                you create an account, generate wishes, or contact us for
                support.
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Email address for account creation and authentication</li>
                <li>Wish content and preferences you create</li>
                <li>
                  Payment information (processed securely through Lemon Squeezy)
                </li>
                <li>Usage data and analytics to improve our service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>To provide and maintain our wish generation service</li>
                <li>To process payments and manage your account</li>
                <li>To send you service updates and support communications</li>
                <li>To improve our service and develop new features</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Information Sharing
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We do not sell, trade, or otherwise transfer your personal
                information to third parties except:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>With your explicit consent</li>
                <li>
                  To trusted service providers who assist in operating our
                  service
                </li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We implement appropriate security measures to protect your
                personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>SSL encryption for data transmission</li>
                <li>Secure cloud storage with Appwrite</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Payment Processing
              </h2>
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 mb-4">
                <p className="text-amber-800 dark:text-amber-200">
                  <strong>Important Payment Notice:</strong> Our payments are
                  processed securely through Lemon Squeezy. After completing
                  your purchase, you must click "Continue" or "Return to
                  Merchant" to return to our website. If you press the back
                  button or close the payment window without completing this
                  step, your order might not register and you may not receive
                  your credits.
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                If you experience any payment issues or don't receive your
                credits after purchase, please contact us immediately at{" "}
                <a
                  href="mailto:login@messagecreate.pro"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  login@messagecreate.pro
                </a>{" "}
                for assistance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Cookies and Tracking
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Remember your preferences and login status</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Provide personalized content and features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Your Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential communications</li>
                <li>
                  File complaints with relevant data protection authorities
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Our service is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If you are a parent or guardian and believe your child
                has provided us with personal information, please contact us
                immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Changes to This Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Contact Us
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-900 dark:text-white font-medium">
                  Email:{" "}
                  <a
                    href="mailto:login@messagecreate.pro"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    login@messagecreate.pro
                  </a>
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  Service: Wish Generator
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
