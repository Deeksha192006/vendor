import mongoose from 'mongoose';
import { Territory } from '../src/models/Territory.js';
import { env } from '../src/config/env.js';

const TERRITORY_DATA = [
  {
    state: { name: 'Tamil Nadu', code: 'TN' },
    districts: [
      {
        name: 'Ariyalur',
        code: 'TN-ARI',
        taluks: [
          { name: 'Ariyalur', code: 'TN-ARI-ARI', pincodes: ['621704', '621705'] },
          { name: 'Sendurai', code: 'TN-ARI-SEN', pincodes: ['621714'] },
          { name: 'Udayarpalayam', code: 'TN-ARI-UDY', pincodes: ['621804'] },
          { name: 'Andimadam', code: 'TN-ARI-AND', pincodes: ['621801'] },
        ],
      },
      {
        name: 'Chengalpattu',
        code: 'TN-CGL',
        taluks: [
          { name: 'Chengalpattu', code: 'TN-CGL-CGL', pincodes: ['603001', '603002'] },
          { name: 'Tambaram', code: 'TN-CGL-TAM', pincodes: ['600045', '600059'] },
          { name: 'Vandalur', code: 'TN-CGL-VAN', pincodes: ['600048'] },
          { name: 'Maduranthakam', code: 'TN-CGL-MAD', pincodes: ['603306'] },
          { name: 'Cheyyur', code: 'TN-CGL-CHE', pincodes: ['603302'] },
          { name: 'Tiruporur', code: 'TN-CGL-TPR', pincodes: ['603110'] },
          { name: 'Thirukalukundram', code: 'TN-CGL-TKK', pincodes: ['603109'] },
        ],
      },
      {
        name: 'Chennai',
        code: 'TN-CHN',
        taluks: [
          { name: 'T. Nagar / Mambalam', code: 'TN-CHN-MAM', pincodes: ['600017', '600033'] },
          { name: 'Adyar / Guindy', code: 'TN-CHN-ADY', pincodes: ['600020', '600032'] },
          { name: 'Anna Nagar', code: 'TN-CHN-ANN', pincodes: ['600040', '600102'] },
          { name: 'Velachery / OMR', code: 'TN-CHN-VEL', pincodes: ['600042', '600096'] },
          { name: 'Egmore', code: 'TN-CHN-EGM', pincodes: ['600008'] },
          { name: 'Mylapore', code: 'TN-CHN-MYL', pincodes: ['600004'] },
          { name: 'Alandur', code: 'TN-CHN-ALA', pincodes: ['600016'] },
          { name: 'Ambattur', code: 'TN-CHN-AMB', pincodes: ['600053'] },
          { name: 'Aminjikarai', code: 'TN-CHN-AMI', pincodes: ['600029'] },
          { name: 'Ayanavaram', code: 'TN-CHN-AYA', pincodes: ['600023'] },
          { name: 'Madhavaram', code: 'TN-CHN-MDH', pincodes: ['600060'] },
          { name: 'Perambur', code: 'TN-CHN-PER', pincodes: ['600011'] },
          { name: 'Purasawalkam', code: 'TN-CHN-PUR', pincodes: ['600007'] },
          { name: 'Thiruvottiyur', code: 'TN-CHN-TVY', pincodes: ['600019'] },
          { name: 'Tondiarpet', code: 'TN-CHN-TON', pincodes: ['600081'] },
          { name: 'Sholinganallur', code: 'TN-CHN-SHO', pincodes: ['600119'] },
        ],
      },
      {
        name: 'Coimbatore',
        code: 'TN-CBE',
        taluks: [
          { name: 'Coimbatore North', code: 'TN-CBE-NOR', pincodes: ['641001', '641002'] },
          { name: 'Coimbatore South', code: 'TN-CBE-SOU', pincodes: ['641008', '641018'] },
          { name: 'Pollachi', code: 'TN-CBE-POL', pincodes: ['642001'] },
          { name: 'Mettupalayam', code: 'TN-CBE-MET', pincodes: ['641301'] },
          { name: 'Annur', code: 'TN-CBE-ANN', pincodes: ['641653'] },
          { name: 'Anaimalai', code: 'TN-CBE-ANA', pincodes: ['642104'] },
          { name: 'Kinathukadavu', code: 'TN-CBE-KIN', pincodes: ['642109'] },
          { name: 'Perur', code: 'TN-CBE-PRR', pincodes: ['641010'] },
          { name: 'Sulur', code: 'TN-CBE-SUL', pincodes: ['641402'] },
          { name: 'Valparai', code: 'TN-CBE-VAL', pincodes: ['642127'] },
        ],
      },
      {
        name: 'Cuddalore',
        code: 'TN-CUD',
        taluks: [
          { name: 'Cuddalore', code: 'TN-CUD-CUD', pincodes: ['607001', '607002'] },
          { name: 'Annamalai Nagar', code: 'TN-CUD-ANN', pincodes: ['608002'] },
          { name: 'Bhuvanagiri', code: 'TN-CUD-BHU', pincodes: ['608601'] },
          { name: 'Kattumannarkoil', code: 'TN-CUD-KAT', pincodes: ['608301'] },
          { name: 'Kurinjipadi', code: 'TN-CUD-KUR', pincodes: ['607302'] },
          { name: 'Panruti', code: 'TN-CUD-PAN', pincodes: ['607106'] },
          { name: 'Srimushnam', code: 'TN-CUD-SRI', pincodes: ['608703'] },
          { name: 'Tittagudi', code: 'TN-CUD-TIT', pincodes: ['606106'] },
          { name: 'Veppur', code: 'TN-CUD-VEP', pincodes: ['606304'] },
          { name: 'Vridhachalam', code: 'TN-CUD-VRI', pincodes: ['606001'] },
        ],
      },
      {
        name: 'Dharmapuri',
        code: 'TN-DMP',
        taluks: [
          { name: 'Dharmapuri', code: 'TN-DMP-DMP', pincodes: ['636701'] },
          { name: 'Harur', code: 'TN-DMP-HAR', pincodes: ['636903'] },
          { name: 'Karimangalam', code: 'TN-DMP-KAR', pincodes: ['635111'] },
          { name: 'Nallampalli', code: 'TN-DMP-NAL', pincodes: ['636807'] },
          { name: 'Palacode', code: 'TN-DMP-PAL', pincodes: ['636808'] },
          { name: 'Pappireddipatti', code: 'TN-DMP-PAP', pincodes: ['636905'] },
          { name: 'Pennagaram', code: 'TN-DMP-PEN', pincodes: ['636810'] },
        ],
      },
      {
        name: 'Dindigul',
        code: 'TN-DGL',
        taluks: [
          { name: 'Dindigul East', code: 'TN-DGL-EAS', pincodes: ['624001'] },
          { name: 'Dindigul West', code: 'TN-DGL-WES', pincodes: ['624002'] },
          { name: 'Attoor', code: 'TN-DGL-ATT', pincodes: ['624301'] },
          { name: 'Gujariliamparai', code: 'TN-DGL-GUJ', pincodes: ['624703'] },
          { name: 'Kodaikanal', code: 'TN-DGL-KOD', pincodes: ['624101'] },
          { name: 'Nattam', code: 'TN-DGL-NAT', pincodes: ['624401'] },
          { name: 'Nilakottai', code: 'TN-DGL-NIL', pincodes: ['624208'] },
          { name: 'Oddanchatram', code: 'TN-DGL-ODD', pincodes: ['624619'] },
          { name: 'Palani', code: 'TN-DGL-PLN', pincodes: ['624601'] },
          { name: 'Vadamadurai', code: 'TN-DGL-VAD', pincodes: ['624802'] },
          { name: 'Vedasandur', code: 'TN-DGL-VED', pincodes: ['624710'] },
        ],
      },
      {
        name: 'Erode',
        code: 'TN-ERD',
        taluks: [
          { name: 'Erode', code: 'TN-ERD-ERD', pincodes: ['638001', '638002'] },
          { name: 'Anthiyur', code: 'TN-ERD-ANT', pincodes: ['638501'] },
          { name: 'Bhavani', code: 'TN-ERD-BHA', pincodes: ['638301'] },
          { name: 'Gobichettipalayam', code: 'TN-ERD-GOB', pincodes: ['638452'] },
          { name: 'Kodumudi', code: 'TN-ERD-KOD', pincodes: ['638151'] },
          { name: 'Modakkurichi', code: 'TN-ERD-MOD', pincodes: ['638104'] },
          { name: 'Nambiyur', code: 'TN-ERD-NAM', pincodes: ['638458'] },
          { name: 'Perundurai', code: 'TN-ERD-PER', pincodes: ['638052'] },
          { name: 'Sathyamangalam', code: 'TN-ERD-SAT', pincodes: ['638401'] },
        ],
      },
      {
        name: 'Kallakurichi',
        code: 'TN-KLK',
        taluks: [
          { name: 'Kallakurichi', code: 'TN-KLK-KLK', pincodes: ['606202'] },
          { name: 'Chinnasalem', code: 'TN-KLK-CHI', pincodes: ['606201'] },
          { name: 'Kalvarayan Hills', code: 'TN-KLK-KAL', pincodes: ['606207'] },
          { name: 'Sankarapuram', code: 'TN-KLK-SAN', pincodes: ['606401'] },
          { name: 'Tirukoilur', code: 'TN-KLK-TIR', pincodes: ['605757'] },
          { name: 'Ulundurpet', code: 'TN-KLK-ULU', pincodes: ['606107'] },
        ],
      },
      {
        name: 'Kanchipuram',
        code: 'TN-KPM',
        taluks: [
          { name: 'Kanchipuram', code: 'TN-KPM-KPM', pincodes: ['631501', '631502'] },
          { name: 'Kundrathur', code: 'TN-KPM-KUN', pincodes: ['600069'] },
          { name: 'Sriperumbudur', code: 'TN-KPM-SRI', pincodes: ['602105'] },
          { name: 'Uthiramerur', code: 'TN-KPM-UTH', pincodes: ['603406'] },
          { name: 'Walajabad', code: 'TN-KPM-WAL', pincodes: ['631605'] },
        ],
      },
      {
        name: 'Kanyakumari',
        code: 'TN-KKI',
        taluks: [
          { name: 'Agastheeswaram', code: 'TN-KKI-AGA', pincodes: ['629001'] },
          { name: 'Kalkulam', code: 'TN-KKI-KAL', pincodes: ['629175'] },
          { name: 'Killiyoor', code: 'TN-KKI-KIL', pincodes: ['629171'] },
          { name: 'Thovalai', code: 'TN-KKI-THO', pincodes: ['629302'] },
          { name: 'Thiruvattar', code: 'TN-KKI-TVT', pincodes: ['629177'] },
          { name: 'Vilavancode', code: 'TN-KKI-VIL', pincodes: ['629163'] },
        ],
      },
      {
        name: 'Karur',
        code: 'TN-KRR',
        taluks: [
          { name: 'Karur', code: 'TN-KRR-KRR', pincodes: ['639001', '639002'] },
          { name: 'Aravakurichi', code: 'TN-KRR-ARA', pincodes: ['639201'] },
          { name: 'Kadavur', code: 'TN-KRR-KAD', pincodes: ['621311'] },
          { name: 'Krishnarayapuram', code: 'TN-KRR-KRI', pincodes: ['639102'] },
          { name: 'Kulithalai', code: 'TN-KRR-KUL', pincodes: ['639104'] },
          { name: 'Manmangalam', code: 'TN-KRR-MAN', pincodes: ['639006'] },
        ],
      },
      {
        name: 'Krishnagiri',
        code: 'TN-KGI',
        taluks: [
          { name: 'Krishnagiri', code: 'TN-KGI-KGI', pincodes: ['635001'] },
          { name: 'Bargur', code: 'TN-KGI-BAR', pincodes: ['635104'] },
          { name: 'Denkanikottai', code: 'TN-KGI-DEN', pincodes: ['635107'] },
          { name: 'Hosur', code: 'TN-KGI-HOS', pincodes: ['635109', '635126'] },
          { name: 'Pochampalli', code: 'TN-KGI-POC', pincodes: ['635206'] },
          { name: 'Shoolagiri', code: 'TN-KGI-SHO', pincodes: ['635117'] },
          { name: 'Thally', code: 'TN-KGI-THA', pincodes: ['635118'] },
          { name: 'Uthangarai', code: 'TN-KGI-UTH', pincodes: ['635207'] },
        ],
      },
      {
        name: 'Madurai',
        code: 'TN-MDU',
        taluks: [
          { name: 'Madurai East', code: 'TN-MDU-EAS', pincodes: ['625001'] },
          { name: 'Madurai North', code: 'TN-MDU-NOR', pincodes: ['625002'] },
          { name: 'Madurai South', code: 'TN-MDU-SOU', pincodes: ['625003'] },
          { name: 'Madurai West', code: 'TN-MDU-WES', pincodes: ['625009'] },
          { name: 'Kalligudi', code: 'TN-MDU-KAL', pincodes: ['625701'] },
          { name: 'Melur', code: 'TN-MDU-MEL', pincodes: ['625106'] },
          { name: 'Peraiyur', code: 'TN-MDU-PER', pincodes: ['625703'] },
          { name: 'Thirumangalam', code: 'TN-MDU-TMG', pincodes: ['625706'] },
          { name: 'Thiruparankundram', code: 'TN-MDU-TPK', pincodes: ['625005'] },
          { name: 'Usilampatti', code: 'TN-MDU-USI', pincodes: ['625532'] },
          { name: 'Vadipatti', code: 'TN-MDU-VAD', pincodes: ['625218'] },
        ],
      },
      {
        name: 'Mayiladuthurai',
        code: 'TN-MYD',
        taluks: [
          { name: 'Mayiladuthurai', code: 'TN-MYD-MYD', pincodes: ['609001'] },
          { name: 'Kuthalam', code: 'TN-MYD-KUT', pincodes: ['609801'] },
          { name: 'Sirkazhi', code: 'TN-MYD-SIR', pincodes: ['609110'] },
          { name: 'Tharangambadi', code: 'TN-MYD-THA', pincodes: ['609313'] },
        ],
      },
      {
        name: 'Nagapattinam',
        code: 'TN-NGP',
        taluks: [
          { name: 'Nagapattinam', code: 'TN-NGP-NGP', pincodes: ['611001'] },
          { name: 'Kilvelur', code: 'TN-NGP-KIL', pincodes: ['611104'] },
          { name: 'Thirukkuvalai', code: 'TN-NGP-TKK', pincodes: ['610204'] },
          { name: 'Vedaranyam', code: 'TN-NGP-VED', pincodes: ['614810'] },
        ],
      },
      {
        name: 'Namakkal',
        code: 'TN-NMK',
        taluks: [
          { name: 'Namakkal', code: 'TN-NMK-NMK', pincodes: ['637001'] },
          { name: 'Komarapalayam', code: 'TN-NMK-KOM', pincodes: ['638183'] },
          { name: 'Kolli Hills', code: 'TN-NMK-KOL', pincodes: ['637411'] },
          { name: 'Mohanur', code: 'TN-NMK-MOH', pincodes: ['637015'] },
          { name: 'Paramathi Velur', code: 'TN-NMK-PAR', pincodes: ['637207'] },
          { name: 'Rasipuram', code: 'TN-NMK-RAS', pincodes: ['637408'] },
          { name: 'Senthamangalam', code: 'TN-NMK-SEN', pincodes: ['637409'] },
          { name: 'Tiruchengode', code: 'TN-NMK-TIR', pincodes: ['637211'] },
        ],
      },
      {
        name: 'Nilgiris',
        code: 'TN-NLG',
        taluks: [
          { name: 'Udhagamandalam (Ooty)', code: 'TN-NLG-UDH', pincodes: ['643001'] },
          { name: 'Coonoor', code: 'TN-NLG-COO', pincodes: ['643101'] },
          { name: 'Gudalur', code: 'TN-NLG-GUD', pincodes: ['643212'] },
          { name: 'Kotagiri', code: 'TN-NLG-KOT', pincodes: ['643217'] },
          { name: 'Kundah', code: 'TN-NLG-KUN', pincodes: ['643219'] },
          { name: 'Pandalur', code: 'TN-NLG-PAN', pincodes: ['643233'] },
        ],
      },
      {
        name: 'Perambalur',
        code: 'TN-PER',
        taluks: [
          { name: 'Perambalur', code: 'TN-PER-PER', pincodes: ['621212'] },
          { name: 'Alathur', code: 'TN-PER-ALA', pincodes: ['621216'] },
          { name: 'Kunnam', code: 'TN-PER-KUN', pincodes: ['621108'] },
          { name: 'Veppanthattai', code: 'TN-PER-VEP', pincodes: ['621116'] },
        ],
      },
      {
        name: 'Pudukkottai',
        code: 'TN-PDK',
        taluks: [
          { name: 'Pudukkottai', code: 'TN-PDK-PDK', pincodes: ['622001'] },
          { name: 'Alangudi', code: 'TN-PDK-ALA', pincodes: ['622301'] },
          { name: 'Aranthangi', code: 'TN-PDK-ARA', pincodes: ['614616'] },
          { name: 'Avudaiyarkoil', code: 'TN-PDK-AVU', pincodes: ['614618'] },
          { name: 'Gandarvakkottai', code: 'TN-PDK-GAN', pincodes: ['613301'] },
          { name: 'Illuppur', code: 'TN-PDK-ILL', pincodes: ['622102'] },
          { name: 'Karambakudi', code: 'TN-PDK-KAR', pincodes: ['622302'] },
          { name: 'Kulathur', code: 'TN-PDK-KUL', pincodes: ['622501'] },
          { name: 'Manamelkudi', code: 'TN-PDK-MAN', pincodes: ['614620'] },
          { name: 'Ponnamaravathi', code: 'TN-PDK-PON', pincodes: ['622407'] },
          { name: 'Thirumayam', code: 'TN-PDK-THI', pincodes: ['622507'] },
        ],
      },
      {
        name: 'Ramanathapuram',
        code: 'TN-RMD',
        taluks: [
          { name: 'Ramanathapuram', code: 'TN-RMD-RMD', pincodes: ['623501'] },
          { name: 'Kadaladi', code: 'TN-RMD-KAD', pincodes: ['623703'] },
          { name: 'Kamuthi', code: 'TN-RMD-KAM', pincodes: ['623601'] },
          { name: 'Mudukulathur', code: 'TN-RMD-MUD', pincodes: ['623704'] },
          { name: 'Paramakudi', code: 'TN-RMD-PAR', pincodes: ['623707'] },
          { name: 'Rajasingamangalam', code: 'TN-RMD-RAJ', pincodes: ['623525'] },
          { name: 'Rameswaram', code: 'TN-RMD-RAM', pincodes: ['623526'] },
          { name: 'Sayalgudi', code: 'TN-RMD-SAY', pincodes: ['623120'] },
          { name: 'Tiruvadanai', code: 'TN-RMD-TIR', pincodes: ['623407'] },
        ],
      },
      {
        name: 'Ranipet',
        code: 'TN-RPT',
        taluks: [
          { name: 'Ranipet', code: 'TN-RPT-RPT', pincodes: ['632401'] },
          { name: 'Arakkonam', code: 'TN-RPT-ARA', pincodes: ['631001'] },
          { name: 'Arcot', code: 'TN-RPT-ARC', pincodes: ['632503'] },
          { name: 'Kalavai', code: 'TN-RPT-KAL', pincodes: ['632506'] },
          { name: 'Nemili', code: 'TN-RPT-NEM', pincodes: ['631051'] },
          { name: 'Sholinghur', code: 'TN-RPT-SHO', pincodes: ['631102'] },
          { name: 'Walajah', code: 'TN-RPT-WAL', pincodes: ['632513'] },
        ],
      },
      {
        name: 'Salem',
        code: 'TN-SLM',
        taluks: [
          { name: 'Salem', code: 'TN-SLM-SLM', pincodes: ['636001'] },
          { name: 'Salem South', code: 'TN-SLM-SOU', pincodes: ['636006'] },
          { name: 'Salem West', code: 'TN-SLM-WES', pincodes: ['636009'] },
          { name: 'Attur', code: 'TN-SLM-ATT', pincodes: ['636102'] },
          { name: 'Edappadi', code: 'TN-SLM-EDA', pincodes: ['637101'] },
          { name: 'Gangavalli', code: 'TN-SLM-GAN', pincodes: ['636105'] },
          { name: 'Kadayampatti', code: 'TN-SLM-KAD', pincodes: ['636309'] },
          { name: 'Mettur', code: 'TN-SLM-MET', pincodes: ['636401'] },
          { name: 'Omalur', code: 'TN-SLM-OMA', pincodes: ['636388'] },
          { name: 'Pethanaickenpalayam', code: 'TN-SLM-PET', pincodes: ['636109'] },
          { name: 'Sankari', code: 'TN-SLM-SAN', pincodes: ['637301'] },
          { name: 'Valapady', code: 'TN-SLM-VAL', pincodes: ['636115'] },
          { name: 'Yercaud', code: 'TN-SLM-YER', pincodes: ['636601'] },
        ],
      },
      {
        name: 'Sivaganga',
        code: 'TN-SVG',
        taluks: [
          { name: 'Sivaganga', code: 'TN-SVG-SVG', pincodes: ['630561'] },
          { name: 'Devakottai', code: 'TN-SVG-DEV', pincodes: ['630302'] },
          { name: 'Ilayangudi', code: 'TN-SVG-ILA', pincodes: ['630702'] },
          { name: 'Kalaiyarkoil', code: 'TN-SVG-KAL', pincodes: ['630551'] },
          { name: 'Karaikudi', code: 'TN-SVG-KAR', pincodes: ['630001'] },
          { name: 'Manamadurai', code: 'TN-SVG-MAN', pincodes: ['630606'] },
          { name: 'Singampunari', code: 'TN-SVG-SIN', pincodes: ['630502'] },
          { name: 'Thirupuvanam', code: 'TN-SVG-TPV', pincodes: ['630611'] },
          { name: 'Tirupathur', code: 'TN-SVG-TPR', pincodes: ['630211'] },
        ],
      },
      {
        name: 'Tenkasi',
        code: 'TN-TNK',
        taluks: [
          { name: 'Tenkasi', code: 'TN-TNK-TNK', pincodes: ['627811'] },
          { name: 'Alangulam', code: 'TN-TNK-ALA', pincodes: ['627851'] },
          { name: 'Kadayanallur', code: 'TN-TNK-KAD', pincodes: ['627751'] },
          { name: 'Radhapuram', code: 'TN-TNK-RAD', pincodes: ['627111'] },
          { name: 'Sankarankovil', code: 'TN-TNK-SAN', pincodes: ['627756'] },
          { name: 'Shenkottai', code: 'TN-TNK-SHE', pincodes: ['627809'] },
          { name: 'Sivagiri', code: 'TN-TNK-SIV', pincodes: ['627757'] },
          { name: 'Thiruvengadam', code: 'TN-TNK-TVG', pincodes: ['627719'] },
          { name: 'Veerakeralamputhur', code: 'TN-TNK-VKP', pincodes: ['627861'] },
        ],
      },
      {
        name: 'Thanjavur',
        code: 'TN-TJV',
        taluks: [
          { name: 'Thanjavur', code: 'TN-TJV-TJV', pincodes: ['613001'] },
          { name: 'Budalur', code: 'TN-TJV-BUD', pincodes: ['613602'] },
          { name: 'Kumbakonam', code: 'TN-TJV-KUM', pincodes: ['612001'] },
          { name: 'Orathanadu', code: 'TN-TJV-ORA', pincodes: ['614625'] },
          { name: 'Papanasam', code: 'TN-TJV-PAP', pincodes: ['614205'] },
          { name: 'Pattukkottai', code: 'TN-TJV-PAT', pincodes: ['614601'] },
          { name: 'Peravurani', code: 'TN-TJV-PER', pincodes: ['614804'] },
          { name: 'Thiruvaiyaru', code: 'TN-TJV-TVY', pincodes: ['613204'] },
          { name: 'Thiruvidaimarudur', code: 'TN-TJV-TVM', pincodes: ['612104'] },
        ],
      },
      {
        name: 'Theni',
        code: 'TN-THN',
        taluks: [
          { name: 'Theni', code: 'TN-THN-THN', pincodes: ['625531'] },
          { name: 'Andipatti', code: 'TN-THN-AND', pincodes: ['625512'] },
          { name: 'Bodinayakanur', code: 'TN-THN-BOD', pincodes: ['625513'] },
          { name: 'Periyakulam', code: 'TN-THN-PER', pincodes: ['625601'] },
          { name: 'Uthamapalayam', code: 'TN-THN-UTH', pincodes: ['625533'] },
        ],
      },
      {
        name: 'Thoothukudi',
        code: 'TN-TUT',
        taluks: [
          { name: 'Thoothukudi', code: 'TN-TUT-TUT', pincodes: ['628001'] },
          { name: 'Eral', code: 'TN-TUT-ERA', pincodes: ['628801'] },
          { name: 'Ettayapuram', code: 'TN-TUT-ETT', pincodes: ['628902'] },
          { name: 'Kayathar', code: 'TN-TUT-KAY', pincodes: ['628952'] },
          { name: 'Kovilpatti', code: 'TN-TUT-KOV', pincodes: ['628501'] },
          { name: 'Ottapidaram', code: 'TN-TUT-OTT', pincodes: ['628401'] },
          { name: 'Sathankulam', code: 'TN-TUT-SAT', pincodes: ['628704'] },
          { name: 'Srivaikuntam', code: 'TN-TUT-SRI', pincodes: ['628601'] },
          { name: 'Tiruchendur', code: 'TN-TUT-TIR', pincodes: ['628215'] },
          { name: 'Vilathikulam', code: 'TN-TUT-VIL', pincodes: ['628907'] },
        ],
      },
      {
        name: 'Tiruchirappalli',
        code: 'TN-TRY',
        taluks: [
          { name: 'Tiruchirappalli East', code: 'TN-TRY-EAS', pincodes: ['620001'] },
          { name: 'Tiruchirappalli West', code: 'TN-TRY-WES', pincodes: ['620002'] },
          { name: 'Lalgudi', code: 'TN-TRY-LAL', pincodes: ['621601'] },
          { name: 'Manachanallur', code: 'TN-TRY-MAN', pincodes: ['621005'] },
          { name: 'Manapparai', code: 'TN-TRY-MNP', pincodes: ['621306'] },
          { name: 'Musiri', code: 'TN-TRY-MUS', pincodes: ['621211'] },
          { name: 'Srirangam', code: 'TN-TRY-SRI', pincodes: ['620006'] },
          { name: 'Thottiyam', code: 'TN-TRY-THO', pincodes: ['621215'] },
          { name: 'Thuraiyur', code: 'TN-TRY-THU', pincodes: ['621010'] },
          { name: 'Tiruverumbur', code: 'TN-TRY-TVR', pincodes: ['620013'] },
        ],
      },
      {
        name: 'Tirunelveli',
        code: 'TN-TNV',
        taluks: [
          { name: 'Tirunelveli', code: 'TN-TNV-TNV', pincodes: ['627001'] },
          { name: 'Ambasamudram', code: 'TN-TNV-AMB', pincodes: ['627401'] },
          { name: 'Cheranmahadevi', code: 'TN-TNV-CHE', pincodes: ['627414'] },
          { name: 'Manur', code: 'TN-TNV-MAN', pincodes: ['627201'] },
          { name: 'Nanguneri', code: 'TN-TNV-NAN', pincodes: ['627108'] },
          { name: 'Palayamkottai', code: 'TN-TNV-PAL', pincodes: ['627002'] },
          { name: 'Radhapuram', code: 'TN-TNV-RAD', pincodes: ['627111'] },
          { name: 'Tisayanvilai', code: 'TN-TNV-TIS', pincodes: ['627657'] },
        ],
      },
      {
        name: 'Tirupathur',
        code: 'TN-TPT',
        taluks: [
          { name: 'Tirupathur', code: 'TN-TPT-TPT', pincodes: ['635601'] },
          { name: 'Ambur', code: 'TN-TPT-AMB', pincodes: ['635802'] },
          { name: 'Jolarpet', code: 'TN-TPT-JOL', pincodes: ['635851'] },
          { name: 'Natrampalli', code: 'TN-TPT-NAT', pincodes: ['635852'] },
          { name: 'Vaniyambadi', code: 'TN-TPT-VAN', pincodes: ['635751'] },
        ],
      },
      {
        name: 'Tiruppur',
        code: 'TN-TPR',
        taluks: [
          { name: 'Tiruppur North', code: 'TN-TPR-NOR', pincodes: ['641601'] },
          { name: 'Tiruppur South', code: 'TN-TPR-SOU', pincodes: ['641604'] },
          { name: 'Avinashi', code: 'TN-TPR-AVI', pincodes: ['641654'] },
          { name: 'Dharapuram', code: 'TN-TPR-DHA', pincodes: ['638656'] },
          { name: 'Kangeyam', code: 'TN-TPR-KAN', pincodes: ['638701'] },
          { name: 'Madathukulam', code: 'TN-TPR-MAD', pincodes: ['642113'] },
          { name: 'Palladam', code: 'TN-TPR-PAL', pincodes: ['641664'] },
          { name: 'Udumalaipettai', code: 'TN-TPR-UDU', pincodes: ['642126'] },
          { name: 'Uthukuli', code: 'TN-TPR-UTH', pincodes: ['638751'] },
        ],
      },
      {
        name: 'Tiruvallur',
        code: 'TN-TVL',
        taluks: [
          { name: 'Tiruvallur', code: 'TN-TVL-TVL', pincodes: ['602001'] },
          { name: 'Avadi', code: 'TN-TVL-AVA', pincodes: ['600054'] },
          { name: 'Gummidipoondi', code: 'TN-TVL-GUM', pincodes: ['601201'] },
          { name: 'Ponneri', code: 'TN-TVL-PON', pincodes: ['601204'] },
          { name: 'Poonamallee', code: 'TN-TVL-PML', pincodes: ['600056'] },
          { name: 'R.K. Pet', code: 'TN-TVL-RKP', pincodes: ['631303'] },
          { name: 'Thiruthani', code: 'TN-TVL-TTN', pincodes: ['631209'] },
          { name: 'Uthukkottai', code: 'TN-TVL-UTH', pincodes: ['602026'] },
        ],
      },
      {
        name: 'Tiruvannamalai',
        code: 'TN-TVM',
        taluks: [
          { name: 'Tiruvannamalai', code: 'TN-TVM-TVM', pincodes: ['606601'] },
          { name: 'Arani', code: 'TN-TVM-ARN', pincodes: ['632301'] },
          { name: 'Chengam', code: 'TN-TVM-CHE', pincodes: ['606701'] },
          { name: 'Chetpet', code: 'TN-TVM-CHT', pincodes: ['606801'] },
          { name: 'Jamunamarathoor', code: 'TN-TVM-JAM', pincodes: ['635703'] },
          { name: 'Kalasapakkam', code: 'TN-TVM-KAL', pincodes: ['606751'] },
          { name: 'Kilpennathur', code: 'TN-TVM-KIL', pincodes: ['604601'] },
          { name: 'Polur', code: 'TN-TVM-POL', pincodes: ['606803'] },
          { name: 'Thandarampattu', code: 'TN-TVM-THA', pincodes: ['606707'] },
          { name: 'Vandavasi', code: 'TN-TVM-VAN', pincodes: ['604408'] },
          { name: 'Vembakkam', code: 'TN-TVM-VEM', pincodes: ['604410'] },
        ],
      },
      {
        name: 'Tiruvarur',
        code: 'TN-TVR',
        taluks: [
          { name: 'Tiruvarur', code: 'TN-TVR-TVR', pincodes: ['610001'] },
          { name: 'Kudavasal', code: 'TN-TVR-KUD', pincodes: ['612601'] },
          { name: 'Mannargudi', code: 'TN-TVR-MAN', pincodes: ['614001'] },
          { name: 'Nannilam', code: 'TN-TVR-NAN', pincodes: ['610105'] },
          { name: 'Needamangalam', code: 'TN-TVR-NEE', pincodes: ['614404'] },
          { name: 'Thiruthuraipoondi', code: 'TN-TVR-TTP', pincodes: ['614713'] },
          { name: 'Valangaiman', code: 'TN-TVR-VAL', pincodes: ['612804'] },
        ],
      },
      {
        name: 'Viluppuram',
        code: 'TN-VPM',
        taluks: [
          { name: 'Viluppuram', code: 'TN-VPM-VPM', pincodes: ['605602'] },
          { name: 'Gingee', code: 'TN-VPM-GIN', pincodes: ['604202'] },
          { name: 'Kandachipuram', code: 'TN-VPM-KAN', pincodes: ['605701'] },
          { name: 'Marakkanam', code: 'TN-VPM-MAR', pincodes: ['604301'] },
          { name: 'Melmalayanur', code: 'TN-VPM-MEL', pincodes: ['604204'] },
          { name: 'Thiruvennainallur', code: 'TN-VPM-TVN', pincodes: ['607203'] },
          { name: 'Tindivanam', code: 'TN-VPM-TIN', pincodes: ['604001'] },
          { name: 'Vanur', code: 'TN-VPM-VAN', pincodes: ['605109'] },
          { name: 'Vikravandi', code: 'TN-VPM-VIK', pincodes: ['605652'] },
        ],
      },
      {
        name: 'Virudhunagar',
        code: 'TN-VNR',
        taluks: [
          { name: 'Virudhunagar', code: 'TN-VNR-VNR', pincodes: ['626001'] },
          { name: 'Aruppukottai', code: 'TN-VNR-ARU', pincodes: ['626101'] },
          { name: 'Kariapatti', code: 'TN-VNR-KAR', pincodes: ['626106'] },
          { name: 'Rajapalayam', code: 'TN-VNR-RAJ', pincodes: ['626117'] },
          { name: 'Sathur', code: 'TN-VNR-SAT', pincodes: ['626203'] },
          { name: 'Sivakasi', code: 'TN-VNR-SIV', pincodes: ['626123'] },
          { name: 'Srivilliputhur', code: 'TN-VNR-SRI', pincodes: ['626125'] },
          { name: 'Tiruchuli', code: 'TN-VNR-TIR', pincodes: ['626129'] },
          { name: 'Vembakottai', code: 'TN-VNR-VEM', pincodes: ['626131'] },
          { name: 'Watrap', code: 'TN-VNR-WAT', pincodes: ['626132'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Karnataka', code: 'KA' },
    districts: [
      {
        name: 'Bengaluru Urban',
        code: 'KA-BLR-URB',
        taluks: [
          { name: 'Bengaluru North', code: 'KA-BLR-NOR', pincodes: ['560001', '560002', '560003', '560004'] },
          { name: 'Bengaluru South', code: 'KA-BLR-SOU', pincodes: ['560011', '560041', '560070', '560078'] },
          { name: 'Bengaluru East', code: 'KA-BLR-EAS', pincodes: ['560016', '560037', '560048', '560066'] },
          { name: 'Yelahanka', code: 'KA-BLR-YEL', pincodes: ['560064', '560065'] },
          { name: 'Anekal', code: 'KA-BLR-ANE', pincodes: ['560099', '560100'] },
        ],
      },
      {
        name: 'Bengaluru Rural',
        code: 'KA-BLR-RUR',
        taluks: [
          { name: 'Devanahalli', code: 'KA-DEV', pincodes: ['562110'] },
          { name: 'Doddaballapura', code: 'KA-DOD', pincodes: ['561203'] },
          { name: 'Hosakote', code: 'KA-HOS', pincodes: ['562114'] },
          { name: 'Nelamangala', code: 'KA-NEL', pincodes: ['562123'] },
        ],
      },
      {
        name: 'Mysuru',
        code: 'KA-MYS',
        taluks: [
          { name: 'Mysuru City', code: 'KA-MYS-CTY', pincodes: ['570001', '570002', '570005'] },
          { name: 'Nanjangud', code: 'KA-MYS-NAN', pincodes: ['571301'] },
          { name: 'Hunsur', code: 'KA-MYS-HUN', pincodes: ['571105'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Delhi (NCT)', code: 'DL' },
    districts: [
      {
        name: 'Central Delhi',
        code: 'DL-CD',
        taluks: [
          { name: 'Connaught Place', code: 'DL-CP', pincodes: ['110001'] },
          { name: 'Karol Bagh', code: 'DL-KB', pincodes: ['110005'] },
        ],
      },
      {
        name: 'South Delhi',
        code: 'DL-SD',
        taluks: [
          { name: 'Hauz Khas', code: 'DL-HK', pincodes: ['110016'] },
          { name: 'Saket', code: 'DL-SKT', pincodes: ['110017'] },
        ],
      },
      {
        name: 'West Delhi',
        code: 'DL-WD',
        taluks: [
          { name: 'Rajouri Garden', code: 'DL-RG', pincodes: ['110027'] },
          { name: 'Janakpuri', code: 'DL-JKP', pincodes: ['110058'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Telangana', code: 'TG' },
    districts: [
      {
        name: 'Hyderabad',
        code: 'TG-HYD',
        taluks: [
          { name: 'Banjara & Jubilee Hills', code: 'TG-BJH', pincodes: ['500034', '500033'] },
          { name: 'Secunderabad', code: 'TG-SEC', pincodes: ['500003'] },
          { name: 'Charminar', code: 'TG-CHR', pincodes: ['500002'] },
        ],
      },
      {
        name: 'Medchal-Malkajgiri',
        code: 'TG-MED',
        taluks: [
          { name: 'Kukatpally', code: 'TG-KUK', pincodes: ['500072'] },
          { name: 'Gachibowli & Madhapur (Hitec City)', code: 'TG-HIT', pincodes: ['500081', '500032'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Gujarat', code: 'GJ' },
    districts: [
      {
        name: 'Ahmedabad',
        code: 'GJ-AMD',
        taluks: [
          { name: 'Ahmedabad City', code: 'GJ-AMD-CTY', pincodes: ['380001', '380006'] },
          { name: 'Navrangpura & Satellite', code: 'GJ-NAV', pincodes: ['380009', '380015'] },
        ],
      },
      {
        name: 'Surat',
        code: 'GJ-SRT',
        taluks: [
          { name: 'Surat City', code: 'GJ-SRT-CTY', pincodes: ['395001', '395002'] },
          { name: 'Varachha', code: 'GJ-VAR', pincodes: ['395006'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Kerala', code: 'KL' },
    districts: [
      {
        name: 'Ernakulam (Kochi)',
        code: 'KL-EKM',
        taluks: [
          { name: 'Kochi & Marine Drive', code: 'KL-KOC', pincodes: ['682001', '682011'] },
          { name: 'Kakkanad (InfoPark)', code: 'KL-KAK', pincodes: ['682030'] },
        ],
      },
    ],
  },
  {
    state: { name: 'West Bengal', code: 'WB' },
    districts: [
      {
        name: 'Kolkata',
        code: 'WB-KOL',
        taluks: [
          { name: 'Central Kolkata', code: 'WB-KOL-CTY', pincodes: ['700001', '700012'] },
          { name: 'Salt Lake & New Town', code: 'WB-SLK', pincodes: ['700091', '700156'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Uttar Pradesh', code: 'UP' },
    districts: [
      {
        name: 'Gautam Buddha Nagar (Noida)',
        code: 'UP-NOI',
        taluks: [
          { name: 'Noida Central', code: 'UP-NOI-CTY', pincodes: ['201301', '201303'] },
          { name: 'Greater Noida', code: 'UP-GRN', pincodes: ['201310'] },
        ],
      },
      {
        name: 'Lucknow',
        code: 'UP-LKO',
        taluks: [
          { name: 'Hazratganj', code: 'UP-HAZ', pincodes: ['226001'] },
          { name: 'Gomti Nagar', code: 'UP-GOM', pincodes: ['226010'] },
        ],
      },
    ],
  },
];

export async function seedTerritories() {
  console.log('📍 Seeding Indian States, Districts, and Taluks for FairKart Dispatch...\n');
  try {
    const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/fairkart';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let totalStates = 0;
    let totalDistricts = 0;
    let totalTaluks = 0;

    for (const item of TERRITORY_DATA) {
      // 1. Upsert State
      const stateDoc = await Territory.findOneAndUpdate(
        { code: item.state.code },
        {
          type: 'STATE',
          name: item.state.name,
          code: item.state.code,
          parentTerritory: null,
          status: 'ACTIVE',
        },
        { upsert: true, new: true }
      );
      totalStates++;

      // 2. Upsert Districts
      for (const dist of item.districts) {
        const distDoc = await Territory.findOneAndUpdate(
          { code: dist.code },
          {
            type: 'DISTRICT',
            name: dist.name,
            code: dist.code,
            parentTerritory: stateDoc._id,
            state: stateDoc.name,
            status: 'ACTIVE',
          },
          { upsert: true, new: true }
        );
        totalDistricts++;

        // 3. Upsert Taluks
        for (const taluk of dist.taluks) {
          await Territory.findOneAndUpdate(
            { code: taluk.code },
            {
              type: 'TALUK',
              name: taluk.name,
              code: taluk.code,
              parentTerritory: distDoc._id,
              state: stateDoc.name,
              district: distDoc.name,
              taluk: taluk.name,
              pincodes: taluk.pincodes,
              status: 'ACTIVE',
            },
            { upsert: true, new: true }
          );
          totalTaluks++;
        }
      }
    }

    console.log(`🎉 Territory Seeding Complete!`);
    console.log(`   • States Seeded: ${totalStates}`);
    console.log(`   • Districts Seeded: ${totalDistricts}`);
    console.log(`   • Taluks / Dispatch Hubs Seeded: ${totalTaluks}\n`);

  } catch (err) {
    console.error('❌ Failed to seed territories:', err);
  } finally {
    if (process.argv[1]?.includes('seedTerritories.js')) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Execute if run directly
if (process.argv[1]?.includes('seedTerritories.js')) {
  seedTerritories().then(() => process.exit(0));
}
