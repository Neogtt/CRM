const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Error initializing email service:', error);
    }
  }

  async sendEmail(to, subject, body, attachments = [], isHTML = true) {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text: isHTML ? this.stripHTML(body) : body,
        html: isHTML ? body : undefined,
        attachments: attachments.map(att => {
          if (typeof att === 'string') {
            return { path: att };
          }
          return att;
        }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkEmail(recipients, subject, body, attachments = [], isHTML = true) {
    const results = [];
    
    // Add signature to body
    const signature = this.getSignature(isHTML);
    const bodyWithSignature = isHTML 
      ? `${body}<br><br>${signature}`
      : `${body}\n\n${signature}`;
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient, subject, bodyWithSignature, attachments, isHTML);
        results.push({ recipient, ...result });
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }

    return results;
  }

  stripHTML(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n');
  }

  getSignature(isHTML = true) {
    const textSignature = `
Saygılarımızla,
EXPOCRM Ekibi
    `.trim();

    const htmlSignature = `
<p>Saygılarımızla,<br>
<strong>EXPOCRM Ekibi</strong></p>
    `.trim();

    return isHTML ? htmlSignature : textSignature;
  }

  // Holiday email templates
  getHolidayTemplate(holidayName, language = 'tr') {
    const templates = {
      'Ramazan Bayramı': {
        tr: {
          subject: 'Ramazan Bayramınız Kutlu Olsun',
          body: '<p>Değerli iş ortağımız,</p><p>Ramazan Bayramınızı en içten dileklerimizle kutlarız. İş birliğimizin artarak devam etmesini diler, sevdiklerinizle birlikte sağlıklı ve mutlu günler temenni ederiz.</p><p>Saygılarımızla,<br>Sekeroğlu Group</p>',
        },
        en: {
          subject: 'Happy Eid al-Fitr',
          body: '<p>Dear business partner,</p><p>We sincerely wish you a joyful and prosperous Eid al-Fitr. Thank you for your trust and cooperation.</p><p>Best regards,<br>Sekeroğlu Group</p>',
        },
        de: {
          subject: 'Frohes Zuckerfest',
          body: '<p>Sehr geehrter Geschäftspartner,</p><p>wir wünschen Ihnen und Ihren Liebsten ein gesegnetes und erfolgreiches Zuckerfest. Vielen Dank für die vertrauensvolle Zusammenarbeit.</p><p>Mit freundlichen Grüßen,<br>Sekeroğlu Group</p>',
        },
        fr: {
          subject: 'Bonne fête de l\'Aïd al-Fitr',
          body: '<p>Cher partenaire,</p><p>Nous vous souhaitons une fête de l\'Aïd al-Fitr pleine de joie et de prospérité. Merci pour votre confiance et votre collaboration.</p><p>Cordialement,<br>Sekeroğlu Group</p>',
        },
        es: {
          subject: 'Feliz Eid al-Fitr',
          body: '<p>Estimado socio,</p><p>Le deseamos un Eid al-Fitr lleno de alegría y prosperidad. Gracias por su confianza y cooperación.</p><p>Saludos cordiales,<br>Sekeroğlu Group</p>',
        },
        ar: {
          subject: 'عيد فطر سعيد',
          body: '<p>شريكنا العزيز،</p><p>نهنئكم بعيد الفطر المبارك ونتمنى لكم ولعائلتكم أياماً مليئة بالخير والنجاح. نشكركم على ثقتكم وشراكتكم المستمرة.</p><p>مع أطيب التحيات،<br>مجموعة شكر أوغلو</p>',
        },
      },
      'Kurban Bayramı': {
        tr: {
          subject: 'Kurban Bayramınız Kutlu Olsun',
          body: '<p>Değerli iş ortağımız,</p><p>Kurban Bayramı\'nın bereket ve mutluluk getirmesini diler, bugüne kadar gösterdiğiniz iş birliği için teşekkür ederiz.</p><p>En iyi dileklerimizle,<br>Sekeroğlu Group</p>',
        },
        en: {
          subject: 'Happy Eid al-Adha',
          body: '<p>Dear business partner,</p><p>May this Eid al-Adha bring peace, happiness, and success to you and your loved ones. Thank you for your continued cooperation.</p><p>Sincerely,<br>Sekeroğlu Group</p>',
        },
        de: {
          subject: 'Frohes Opferfest',
          body: '<p>Sehr geehrter Geschäftspartner,</p><p>möge das Opferfest Ihnen und Ihrem Team Frieden, Gesundheit und Erfolg bringen. Wir danken Ihnen für die gute Zusammenarbeit.</p><p>Mit freundlichen Grüßen,<br>Sekeroğlu Group</p>',
        },
        fr: {
          subject: 'Bonne fête de l\'Aïd al-Adha',
          body: '<p>Cher partenaire,</p><p>Que cette fête de l\'Aïd al-Adha vous apporte paix, bonheur et réussite. Merci pour votre collaboration précieuse.</p><p>Cordialement,<br>Sekeroğlu Group</p>',
        },
        es: {
          subject: 'Feliz Eid al-Adha',
          body: '<p>Estimado socio,</p><p>Que este Eid al-Adha le traiga paz, felicidad y éxito a usted y a su equipo. Gracias por su apoyo continuo.</p><p>Saludos cordiales,<br>Sekeroğlu Group</p>',
        },
        ar: {
          subject: 'عيد أضحى مبارك',
          body: '<p>شريكنا العزيز،</p><p>نتمنى أن يحمل لكم عيد الأضحى المبارك السلام والسعادة والنجاح، ونشكركم على تعاونكم المستمر.</p><p>مع خالص التقدير،<br>مجموعة شكر أوغلو</p>',
        },
      },
      'Yeni Yıl': {
        tr: {
          subject: 'Mutlu Yıllar',
          body: '<p>Değerli iş ortağımız,</p><p>Geride bıraktığımız yıl boyunca gösterdiğiniz destek için teşekkür ederiz. Yeni yılın size ve ekibinize sağlık, mutluluk ve başarı getirmesini dileriz.</p><p>Sevgi ve saygılarımızla,<br>Sekeroğlu Group</p>',
        },
        en: {
          subject: 'Happy New Year',
          body: '<p>Dear business partner,</p><p>Thank you for the trust and partnership throughout the past year. We wish you and your team a healthy and prosperous New Year.</p><p>Warm regards,<br>Sekeroğlu Group</p>',
        },
        de: {
          subject: 'Frohes Neues Jahr',
          body: '<p>Sehr geehrter Geschäftspartner,</p><p>vielen Dank für Ihre Unterstützung im vergangenen Jahr. Wir wünschen Ihnen und Ihrem Team ein gesundes und erfolgreiches neues Jahr.</p><p>Mit besten Grüßen,<br>Sekeroğlu Group</p>',
        },
        fr: {
          subject: 'Bonne année',
          body: '<p>Cher partenaire,</p><p>Merci pour votre confiance tout au long de l\'année écoulée. Nous vous souhaitons, à vous et à votre équipe, une nouvelle année pleine de santé et de réussite.</p><p>Cordialement,<br>Sekeroğlu Group</p>',
        },
        es: {
          subject: 'Feliz Año Nuevo',
          body: '<p>Estimado socio,</p><p>Gracias por su confianza y colaboración durante el último año. Les deseamos a usted y a su equipo un Año Nuevo lleno de salud y prosperidad.</p><p>Saludos cordiales,<br>Sekeroğlu Group</p>',
        },
        ar: {
          subject: 'سنة جديدة سعيدة',
          body: '<p>شريكنا العزيز،</p><p>نشكر لكم ثقتكم وشراكتكم طوال العام الماضي، ونتمنى لكم ولفريقكم عاماً جديداً مليئاً بالصحة والنجاح.</p><p>مع أطيب الأمنيات،<br>مجموعة شكر أوغلو</p>',
        },
      },
    };

    const holiday = templates[holidayName];
    if (!holiday) {
      // Return fallback template if holiday not found
      const fallbackTemplates = {
        'Ramazan Bayramı': {
          subject: 'Ramazan Bayramınız Kutlu Olsun / Happy Eid al-Fitr',
          body: '<p>Değerli iş ortağımız,</p><p>Ramazan Bayramınızı en içten dileklerimizle kutlarız. İş birliğimizin artarak devam etmesini diler, sevdiklerinizle birlikte sağlıklı ve mutlu günler temenni ederiz.</p><p>Saygılarımızla,<br>Sekeroğlu Group</p><hr><p>Dear business partner,</p><p>We sincerely wish you a joyful and prosperous Eid al-Fitr. Thank you for your trust and cooperation.</p><p>Best regards,<br>Sekeroğlu Group</p>',
        },
        'Kurban Bayramı': {
          subject: 'Kurban Bayramınız Kutlu Olsun / Happy Eid al-Adha',
          body: '<p>Değerli iş ortağımız,</p><p>Kurban Bayramı\'nın bereket ve mutluluk getirmesini diler, bugüne kadar gösterdiğiniz iş birliği için teşekkür ederiz.</p><p>En iyi dileklerimizle,<br>Sekeroğlu Group</p><hr><p>Dear business partner,</p><p>May this Eid al-Adha bring peace, happiness and success to you and your loved ones.</p><p>Sincerely,<br>Sekeroğlu Group</p>',
        },
        'Yeni Yıl': {
          subject: 'Mutlu Yıllar / Happy New Year',
          body: '<p>Değerli iş ortağımız,</p><p>Geride bıraktığımız yıl boyunca gösterdiğiniz destek için teşekkür ederiz. Yeni yılın size ve ekibinize sağlık, mutluluk ve başarı getirmesini dileriz.</p><p>Sevgi ve saygılarımızla,<br>Sekeroğlu Group</p><hr><p>Dear business partner,</p><p>Thank you for the trust and partnership throughout the past year. Wishing you a healthy and prosperous New Year.</p><p>Warm regards,<br>Sekeroğlu Group</p>',
        },
      };
      return fallbackTemplates[holidayName] || null;
    }

    // Return specific language or fallback to Turkish
    return holiday[language] || holiday.tr || null;
  }
  
  // Get available languages for a holiday template
  getHolidayTemplateLanguages(holidayName) {
    const templates = {
      'Ramazan Bayramı': ['tr', 'en', 'de', 'fr', 'es', 'ar'],
      'Kurban Bayramı': ['tr', 'en', 'de', 'fr', 'es', 'ar'],
      'Yeni Yıl': ['tr', 'en', 'de', 'fr', 'es', 'ar'],
    };
    return templates[holidayName] || [];
  }
  
  // Get all available holiday template names
  getHolidayTemplateNames() {
    return ['Ramazan Bayramı', 'Kurban Bayramı', 'Yeni Yıl'];
  }

  // Fair email templates
  getFairTemplate(language = 'tr') {
    const templates = {
      tr: {
        subject: 'Fuar Görüşmemiz Hakkında',
        body: `
          <p>Merhaba,</p>
          <p>Fuarda standımızı ziyaret ettiğiniz için teşekkür ederiz. Sunduğumuz ürün ve çözümler hakkında sorularınızı yanıtlamaktan memnuniyet duyarız.</p>
          <p>İhtiyaçlarınızı daha iyi anlayabilmek ve iş birliği fırsatlarını görüşmek için uygun olduğunuz bir zamanı paylaşmanızı rica ederiz.</p>
          <p>Saygılarımızla,<br>EXPOCRM Ekibi</p>
        `,
      },
      en: {
        subject: 'Thank You for Visiting EXPOCRM at the Fair',
        body: `
          <p>Hello,</p>
          <p>Thank you for taking the time to meet with us during the trade fair. We would be delighted to continue the conversation and share tailored solutions for your business.</p>
          <p>Please let us know a convenient time for a follow-up call or meeting so that we can discuss the next steps together.</p>
          <p>Best regards,<br>EXPOCRM Team</p>
        `,
      },
      // Add more language templates as needed
    };

    return templates[language] || templates.tr;
  }

  extractUniqueEmails(emailString) {
    if (!emailString) return [];
    
    const emails = emailString
      .split(/[,;\s]+/)
      .map(email => email.trim())
      .filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      });

    return [...new Set(emails)];
  }
}

module.exports = new EmailService();

