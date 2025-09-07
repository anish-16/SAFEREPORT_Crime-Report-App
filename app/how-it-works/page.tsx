"use client";
import { FaFileAlt, FaLock, FaSearch, FaCheckCircle } from "react-icons/fa";

const HowItWorks = () => {
  return (
    <section className="bg-gray-900 text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-8">How It Works</h2>
      </div>
      
      {/* Step-by-Step Process */}
      <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
        {[ 
          { icon: FaFileAlt, color: "text-blue-500", title: "Submit Report", text: "Fill out an anonymous form with incident details." },
          { icon: FaLock, color: "text-green-500", title: "Encryption & Security", text: "Your report is securely encrypted and stored." },
          { icon: FaSearch, color: "text-yellow-500", title: "Track Progress", text: "Receive a tracking ID to monitor status." },
          { icon: FaCheckCircle, color: "text-red-500", title: "Authorities Respond", text: "Reports are reviewed by relevant teams." }
        ].map((step, index) => (
          <div key={index} className="flex flex-col items-center group">
            <step.icon className={`text-5xl mb-4 transition-transform transform group-hover:scale-110 ${step.color}`} />
            <h3 className="text-xl font-semibold">{step.title}</h3>
            <p className="text-gray-400 text-sm">{step.text}</p>
          </div>
        ))}
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-4xl mx-auto mt-12">
        <h3 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[ 
            { question: "Is my identity protected?", answer: "Yes, all reports are anonymous, and no personal data is stored." },
            { question: "Can I track my report?", answer: "Yes, you will receive a unique tracking ID to check updates." },
            { question: "Who receives my report?", answer: "Authorized personnel in law enforcement and relevant agencies." }
          ].map((faq, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg transition-all duration-300 hover:bg-gray-700">
              <h4 className="text-lg font-semibold">{faq.question}</h4>
              <p className="text-gray-400 text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default HowItWorks;
