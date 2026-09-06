from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "legal" / "roomsnow-terms-of-use.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

SECTIONS = [
    ("1. About these terms", [
        "By creating an account, accessing a restricted feature, buying a membership or continuing to use the service after being notified of a change, you agree to these terms. If you use RoomsNow for an organisation, you confirm that you have authority to bind it. If you do not agree, do not use the service."
    ]),
    ("2. The RoomsNow service", [
        "RoomsNow is a technology platform for finding and advertising housing and accommodation, including HMOs, supported and transitional accommodation, adult social care housing, shared homes and self-contained properties. It provides search, profiles, messaging, referrals and workflow tools.",
        "RoomsNow is not a landlord, letting agent, care or support provider, local authority, commissioner, regulator, financial adviser or placement decision-maker. Unless expressly stated in writing, RoomsNow is not party to an occupancy, tenancy, support, referral or funding agreement between users."
    ]),
    ("3. Eligibility and accounts", [
        "Account holders must be at least 18 and legally able to agree to these terms. Information supplied must be accurate, current and not misleading. Login details are personal and must be protected, and suspected compromise must be reported promptly.",
        "Organisation administrators are responsible for staff access, permissions and removing leavers. You are responsible for activity through your account unless caused by RoomsNow's failure to use reasonable care."
    ]),
    ("4. Providers and accommodation adverts", [
        "Providers are responsible for their properties, services and every statement made in an advert. They must have authority to advertise; state rents, charges, deposits, availability, eligibility, accessibility and support accurately; and update unavailable or expired information promptly.",
        "Providers must hold the licences, registrations, permissions, insurance and safety records required for their activities; comply with housing, HMO, planning, fire, equality, consumer, safeguarding, care and data-protection law; and carry out lawful suitability, affordability, safeguarding and right-to-rent checks where applicable.",
        "RoomsNow review of an advert does not verify every claim or make the accommodation suitable for a particular person."
    ]),
    ("5. Provider due diligence and verification", [
        "Providers requesting a badge must submit accurate, current evidence of legal identity, registration, insurance, governance and safeguarding arrangements and must keep it updated. RoomsNow may check public registers, request more evidence, record reviewer decisions and re-review or withdraw a badge.",
        "A badge is limited to the checks described on the verification page. It is not an inspection, accreditation, regulatory endorsement, guarantee of quality or recommendation. Fraudulent or altered evidence may lead to immediate suspension and referral to relevant authorities."
    ]),
    ("6. People looking for accommodation", [
        "Applicants must provide accurate information and use the service lawfully. A search result, message, match or provider response is not an offer, allocation or guarantee. Before sharing money or documents, users should verify the provider, view the accommodation where possible, understand all agreements and charges, and obtain independent advice where appropriate."
    ]),
    ("7. Professional referrers", [
        "Referrers must be authorised to act, follow their organisation's policies and complete their own assessment. Before entering another person's information, the referrer must provide appropriate privacy information and establish a valid UK GDPR lawful basis and, where relevant, an Article 9 or criminal-offence-data condition.",
        "Consent must be informed, specific and recorded whenever consent is relied upon. Do not upload information unnecessary for the referral."
    ]),
    ("8. Messaging and platform conduct", [
        "You must not mislead, impersonate, discriminate unlawfully, harass, threaten or exploit another person; publish unlawful, defamatory, infringing, unsafe or inappropriate material; scrape, reverse engineer, overload, probe or bypass security; send spam or malware; circumvent charges or manipulate rankings; or share confidential or sensitive information without authority."
    ]),
    ("9. Content and intellectual property", [
        "You retain ownership of content you submit. You give RoomsNow a non-exclusive, worldwide, royalty-free licence to host, copy, resize, display and distribute it only as needed to operate, secure and promote the service. You confirm you have the rights and permissions needed for that content.",
        "RoomsNow owns or licenses the platform, branding, design and software. No rights are transferred except the limited right to use the service under these terms."
    ]),
    ("10. Memberships, payments and renewals", [
        "Prices, taxes, billing intervals, included limits and any minimum term are shown before payment. Memberships may renew automatically where clearly stated at checkout. You may manage or cancel a renewal from the membership page.",
        "Cancellation normally takes effect at the end of the paid billing period unless the checkout terms or law require otherwise. Statutory cancellation and refund rights are not restricted. Failed payments may limit paid features after reasonable notice."
    ]),
    ("11. Promoted adverts", [
        "Paid promotion provides labelled placement subject to the selected duration, availability, matching filters and moderation. It does not guarantee impressions, enquiries or placements and never changes verification, safety review or organic eligibility. Promotion may be paused where an advert is paused, removed or no longer eligible."
    ]),
    ("12. Moderation, reports and investigations", [
        "RoomsNow may review adverts, profiles, reports, account activity and verification evidence; request information; restrict visibility; preserve relevant records; or refer concerns where reasonably needed for safety, law enforcement, fraud prevention or platform integrity. Private message content is accessed only where authorised and necessary under the privacy notice and applicable law."
    ]),
    ("13. Suspension and termination", [
        "RoomsNow may warn, restrict, suspend or close an account for a material or repeated breach, non-payment, safety risk, unlawful activity, misleading evidence or a legal requirement. Immediate action may be taken where delay could create harm. Otherwise, reasonable notice and an opportunity to respond will be given where practical.",
        "You may stop using the service and request account closure at any time, subject to lawful record-retention requirements."
    ]),
    ("14. Service availability and changes", [
        "RoomsNow aims to provide a reliable service but does not promise uninterrupted or error-free access. Features may change for security, legal, operational or product reasons. Material changes that adversely affect paid services will be notified in advance where reasonably possible."
    ]),
    ("15. Responsibility and liability", [
        "Nothing excludes liability that cannot lawfully be excluded, including liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or statutory consumer rights.",
        "To the extent permitted by law, RoomsNow is not responsible for decisions, conduct, property conditions, services or agreements of users, or for indirect or unforeseeable loss. Business users are responsible for losses caused by their breach, unlawful content or lack of authority to share data."
    ]),
    ("16. Privacy and confidentiality", [
        "Personal information is handled as described in the RoomsNow privacy notice. Users receiving confidential or personal information through RoomsNow must protect it, limit access to authorised people and use it only for the relevant housing, support or referral purpose."
    ]),
    ("17. Changes to these terms", [
        "RoomsNow may update these terms to reflect law, safety requirements or service changes. The updated date will be shown and material changes will be brought to account holders' attention. Changes do not apply retrospectively to completed transactions unless required by law."
    ]),
    ("18. Governing law, complaints and contact", [
        "These terms are governed by the law of England and Wales. Consumers retain any mandatory rights to bring proceedings in the part of the UK where they live.",
        "Raise complaints first with RoomsNow at info@roomsnow.co.uk. This does not affect rights to contact a regulator, ombudsman, trading standards service or court."
    ]),
]


def page_decor(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(colors.HexColor("#D9E3ED"))
    canvas.line(20 * mm, 16 * mm, width - 20 * mm, 16 * mm)
    canvas.setFillColor(colors.HexColor("#53687B"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(20 * mm, 10 * mm, "RoomsNow Terms of Use - updated 6 September 2026")
    canvas.drawRightString(width - 20 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleBlue", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=28, leading=33, textColor=colors.HexColor("#102539"), alignment=TA_CENTER, spaceAfter=8 * mm))
styles.add(ParagraphStyle(name="Subtitle", parent=styles["BodyText"], fontSize=11, leading=16, textColor=colors.HexColor("#53687B"), alignment=TA_CENTER, spaceAfter=5 * mm))
styles.add(ParagraphStyle(name="SectionTitle", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=colors.HexColor("#1666AA"), spaceBefore=4 * mm, spaceAfter=2 * mm, keepWithNext=True))
styles.add(ParagraphStyle(name="LegalBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.5, leading=14, textColor=colors.HexColor("#263B4D"), spaceAfter=2.5 * mm))
styles.add(ParagraphStyle(name="Notice", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=9.5, leading=14, textColor=colors.HexColor("#102539"), backColor=colors.HexColor("#E8F2FC"), borderColor=colors.HexColor("#A9CBE8"), borderWidth=0.5, borderPadding=9, spaceAfter=7 * mm))

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm, topMargin=20 * mm, bottomMargin=22 * mm, title="RoomsNow Terms of Use", author="RoomsNow")
story = [
    Spacer(1, 15 * mm),
    Paragraph("RoomsNow", styles["TitleBlue"]),
    Paragraph("Terms of Use", ParagraphStyle(name="MainHeading", parent=styles["TitleBlue"], fontSize=22, leading=27, textColor=colors.HexColor("#1666AA"))),
    Paragraph("Updated 6 September 2026", styles["Subtitle"]),
    Paragraph("These terms govern access to and use of RoomsNow, including listings, enquiries, referrals, messaging, verification, memberships and promoted adverts.", styles["Notice"]),
    Paragraph("Important: RoomsNow is a technology platform. It is not a landlord, care provider, regulator or placement decision-maker. Users must complete their own legal, safety and suitability checks.", styles["LegalBody"]),
    PageBreak(),
]

for heading, paragraphs in SECTIONS:
    story.append(Paragraph(heading, styles["SectionTitle"]))
    story.append(Spacer(1, 1.5 * mm))
    for paragraph in paragraphs:
        story.append(Paragraph(paragraph, styles["LegalBody"]))

doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
print(OUTPUT)
