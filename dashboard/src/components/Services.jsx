import React from 'react';
import './Services.css';

const servicesData = [
  {
    id: "01",
    title: "Web solution development",
    description: "Unleashing competitive advantage via software mastery and research brilliance to build robust web platforms."
  },
  {
    id: "02",
    title: "Native and cross-platform mobile applications",
    description: "Developing feature-packed mobile solutions for iOS and Android that are intuitive and easy to use."
  },
  {
    id: "03",
    title: "Project & product consulting",
    description: "Navigating the complexities of dynamic markets with expert product research and strategic decision-making."
  },
  {
    id: "04",
    title: "Integration with third-party services",
    description: "Seamlessly connecting your enterprise systems with modern APIs and third-party infrastructure."
  }
];

const Services = () => {
  return (
    <section className="aux-services-section" id="services">
      <div className="aux-container">
        
        {/* Header Area */}
        <div className="aux-header">
          <h2 className="aux-title">What we can help you with</h2>
          <p className="aux-subtitle">
            Unleashing competitive advantage via software mastery and research brilliance.
          </p>
        </div>

        {/* Services List */}
        <div className="aux-services-list">
          {servicesData.map((service) => (
            <div className="aux-service-card" key={service.id}>
              <div className="aux-service-number">&lt;{service.id}&gt;</div>
              <div className="aux-service-content">
                <h3 className="aux-service-title">{service.title}</h3>
                <p className="aux-service-desc">{service.description}</p>
              </div>
              <div className="aux-service-action">
                <button className="aux-btn">Let's talk ↗</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Services;