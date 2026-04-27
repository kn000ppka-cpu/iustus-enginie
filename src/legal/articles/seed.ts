/**
 * Seed-каталог Особенной части УК РФ.
 *
 * Это компактный «образец», 10 высокочастотных статей, на которых отлажена
 * структура. Полный каталог Особенной части (~270 статей) предполагается
 * заполнять отдельным пайплайном — см. `docs/parser-prompt.md`.
 *
 * При добавлении новой статьи следуйте формату существующих записей:
 *   • `number` — арабская строка, как в УК: '105', '228.1';
 *   • `title`  — краткое название состава (для поиска в UI);
 *   • `parts[i].part` — '1', '2', '2.1' и т. д.;
 *   • `parts[i].disposition` — лаконичное описание состава для UI;
 *   • `parts[i].sanctions` — список альтернатив + дополнительные;
 *   • `parts[i].category` — категория по ст. 15. Должна совпадать с
 *      `deriveCategory(part, form)` (проверяется в seed.test.ts).
 *
 * Источник: УК РФ в действующей редакции на 2025 г.
 */

import { CrimeCategory } from '@domain/enums';
import type { UkArticle } from '@domain/types';
import {
  arrestUpToM,
  correctUpToM,
  correctUpToY,
  deprRightAddY,
  fineRub,
  fineUpToRub,
  forcedUpToY,
  imprUpToY,
  imprY,
  lifeImpr,
  mandatoryUpToH,
  restrictAddY,
  restrictUpToY,
  restrictY,
} from './helpers';

export const SEED_ARTICLES: UkArticle[] = [
  // ── 105 Убийство ────────────────────────────────────────────────────────
  {
    number: '105',
    title: 'Убийство',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Убийство, то есть умышленное причинение смерти другому человеку.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(6, 15), restrictAddY(2)],
      },
      {
        part: '2',
        disposition:
          'Убийство при квалифицирующих признаках (двух и более лиц; малолетнего; общеопасным способом; группой; из корыстных побуждений; и др.).',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(8, 20), lifeImpr(), restrictAddY(2)],
      },
    ],
  },

  // ── 111 Умышленное причинение тяжкого вреда здоровью ────────────────────
  {
    number: '111',
    title: 'Умышленное причинение тяжкого вреда здоровью',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Умышленное причинение тяжкого вреда здоровью (опасный для жизни / повлёкший утрату органа / прерывание беременности и т. д.).',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(8)],
      },
      {
        part: '2',
        disposition:
          'То же деяние при квалифицирующих признаках (в отношении лица в связи с осущ. служебной деятельности; в отношении малолетнего; группой и пр.).',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(10), restrictAddY(2)],
      },
      {
        part: '3',
        disposition:
          'Деяния ч. 1 или ч. 2, совершённые группой лиц, по предварительному сговору, организованной группой, в отношении двух и более лиц.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 12), restrictAddY(2)],
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1–3, повлёкшие по неосторожности смерть потерпевшего.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(5, 15), restrictAddY(2)],
      },
    ],
  },

  // ── 158 Кража ───────────────────────────────────────────────────────────
  {
    number: '158',
    title: 'Кража',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition: 'Кража, то есть тайное хищение чужого имущества.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(80_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(4),
          imprUpToY(2),
        ],
      },
      {
        part: '2',
        disposition:
          'Кража, совершённая группой лиц по предварит. сговору; с незаконным проникновением; из одежды/ручной клади; с причинением знач. ущерба гражданину.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(200_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(5),
          imprUpToY(5),
          restrictAddY(1),
        ],
      },
      {
        part: '3',
        disposition:
          'Кража, совершённая с незаконным проникновением в жилище; в крупном размере; с банковского счёта; в отношении электроэнергии и т. д.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprUpToY(6),
          fineRub(0, 80_000),
          restrictAddY(1.5),
        ],
      },
      {
        part: '4',
        disposition: 'Кража, совершённая организованной группой; в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(0, 10), fineRub(0, 1_000_000), restrictAddY(2)],
      },
    ],
  },

  // ── 161 Грабёж ──────────────────────────────────────────────────────────
  {
    number: '161',
    title: 'Грабёж',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition: 'Грабёж — открытое хищение чужого имущества.',
        category: CrimeCategory.Medium,
        sanctions: [
          mandatoryUpToH(480),
          correctUpToY(2),
          restrictY(2, 4),
          forcedUpToY(4),
          arrestUpToM(6),
          imprUpToY(4),
        ],
      },
      {
        part: '2',
        disposition:
          'Грабёж, совершённый группой; с незакон. проникновением; с насилием не опасным для жизни; в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(0, 7), fineRub(0, 10_000), restrictAddY(1)],
      },
      {
        part: '3',
        disposition:
          'Грабёж, совершённый организованной группой; в особо крупном размере.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(6, 12), fineRub(0, 1_000_000), restrictAddY(2)],
      },
    ],
  },

  // ── 162 Разбой ──────────────────────────────────────────────────────────
  {
    number: '162',
    title: 'Разбой',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Разбой — нападение в целях хищения с применением насилия, опасного для жизни/здоровья, либо с угрозой такого насилия.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(8), fineRub(0, 500_000)],
      },
      {
        part: '2',
        disposition:
          'Разбой, совершённый группой лиц по предварит. сговору, с применением оружия / предметов, используемых как оружие.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(10), fineRub(0, 1_000_000), restrictAddY(2)],
      },
      {
        part: '3',
        disposition:
          'Разбой, совершённый с незакон. проникновением в жилище; в крупном размере.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(7, 12), fineRub(0, 1_000_000), restrictAddY(2)],
      },
      {
        part: '4',
        disposition:
          'Разбой, совершённый организованной группой; в особо крупном размере; с прич. тяжкого вреда здоровью.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(8, 15), fineRub(0, 1_000_000), restrictAddY(2)],
      },
    ],
  },

  // ── 228 Незаконные приобретение, хранение, перевозка, изготовление НС ───
  {
    number: '228',
    title: 'Незаконные приобретение/хранение/перевозка наркотических средств',
    chapter: 'Глава 25. Преступления против здоровья населения и обществ. нравственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Незаконные приобретение, хранение, перевозка, изготовление, переработка НС/ПВ/аналогов в значительном размере без цели сбыта.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(40_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          restrictUpToY(3),
          imprUpToY(3),
        ],
      },
      {
        part: '2',
        disposition: 'Те же деяния, совершённые в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(3, 10), fineRub(0, 500_000), restrictAddY(1)],
      },
      {
        part: '3',
        disposition: 'Те же деяния, совершённые в особо крупном размере.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(10, 15), fineRub(0, 500_000), restrictAddY(1.5)],
      },
    ],
  },

  // ── 228.1 Незаконные производство, сбыт, пересылка наркотиков ──────────
  {
    number: '228.1',
    title: 'Незаконный сбыт наркотических средств',
    chapter: 'Глава 25. Преступления против здоровья населения и обществ. нравственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition: 'Незаконный сбыт НС/ПВ/аналогов.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(4, 8), restrictAddY(1)],
      },
      {
        part: '2',
        disposition:
          'Сбыт, совершённый в следственном изоляторе/на территории учр. образования; с использованием СМИ/Интернета; группой лиц.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(5, 12), fineRub(0, 500_000), restrictAddY(1.5)],
      },
      {
        part: '3',
        disposition:
          'Сбыт, совершённый группой лиц по предварит. сговору; в значительном размере.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(8, 15), fineRub(0, 500_000), restrictAddY(2)],
      },
      {
        part: '4',
        disposition:
          'Сбыт, совершённый организованной группой; лицом с использованием служебного положения; совершеннолетним в отношении несовершеннолетнего; в крупном размере.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(10, 20), fineRub(0, 1_000_000), restrictAddY(2)],
      },
      {
        part: '5',
        disposition: 'Деяния чч. 1–4, совершённые в особо крупном размере.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(15, 20), lifeImpr(), fineRub(0, 1_000_000), restrictAddY(2)],
      },
    ],
  },

  // ── 264 Нарушение ПДД и эксплуатации ТС ────────────────────────────────
  {
    number: '264',
    title: 'Нарушение правил дорожного движения и эксплуатации ТС',
    chapter: 'Глава 27. Преступления против безопасности движения и эксплуатации транспорта',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Нарушение ПДД лицом, управляющим ТС, повлёкшее по неосторожности тяжкий вред здоровью.',
        category: CrimeCategory.Small,
        sanctions: [
          restrictUpToY(3),
          forcedUpToY(2),
          arrestUpToM(6),
          imprUpToY(2),
          deprRightAddY(3),
        ],
      },
      {
        part: '2',
        disposition: 'То же деяние, совершённое в состоянии опьянения / при оставлении места ДТП.',
        category: CrimeCategory.Medium,
        sanctions: [imprY(3, 7), deprRightAddY(3, true)],
      },
      {
        part: '3',
        disposition: 'Деяние ч. 1, повлёкшее по неосторожности смерть человека.',
        category: CrimeCategory.Medium,
        sanctions: [forcedUpToY(4), imprUpToY(5), deprRightAddY(3, true)],
      },
      {
        part: '4',
        disposition:
          'Деяние ч. 1, в состоянии опьянения / при оставлении места ДТП, повлёкшее по неосторожности смерть человека.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(5, 12), deprRightAddY(3, true)],
      },
      {
        part: '5',
        disposition:
          'Деяние ч. 1, повлёкшее по неосторожности смерть двух и более лиц.',
        category: CrimeCategory.Medium,
        sanctions: [forcedUpToY(5), imprUpToY(7), deprRightAddY(3, true)],
      },
      {
        part: '6',
        disposition:
          'Деяние ч. 1, в состоянии опьянения / при оставлении места ДТП, повлёкшее смерть двух и более лиц.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(8, 15), deprRightAddY(3, true)],
      },
    ],
  },

  // ── 264.1 Управление ТС в состоянии опьянения повторно ─────────────────
  {
    number: '264.1',
    title: 'Нарушение ПДД лицом, ранее подвергнутым адм. наказанию / судимым',
    chapter: 'Глава 27. Преступления против безопасности движения и эксплуатации транспорта',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Управление ТС в состоянии опьянения лицом, подвергнутым адм. наказанию по ст. 12.8/12.26 КоАП.',
        category: CrimeCategory.Small,
        sanctions: [
          fineRub(200_000, 300_000),
          mandatoryUpToH(480),
          imprUpToY(2),
          deprRightAddY(3, true),
        ],
      },
    ],
  },

  // ── 318 Применение насилия в отношении представителя власти ────────────
  {
    number: '318',
    title: 'Применение насилия в отношении представителя власти',
    chapter: 'Глава 32. Преступления против порядка управления',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Применение насилия, не опасного для жизни/здоровья, либо угроза применения насилия в отношении представителя власти в связи с исполнением им обязанностей.',
        category: CrimeCategory.Medium,
        sanctions: [fineUpToRub(200_000), forcedUpToY(5), imprUpToY(5)],
      },
      {
        part: '2',
        disposition:
          'Применение насилия, опасного для жизни/здоровья, в отношении представителя власти / его близких.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(0, 10)],
      },
    ],
  },

  // ── Глава 16. Жизнь и здоровье — добавочный пакет (партия 1) ───────────
  // Источник: УК РФ ред. 09.04.2026 (распарсено отдельным агентом).
  // Категории пересчитаны вручную по ст. 15 УК и проверены seed.test.ts.

  {
    number: '106',
    title: 'Убийство матерью новорождённого ребёнка',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Убийство матерью новорождённого ребёнка во время или сразу после родов / в психотравмирующей ситуации / в состоянии псих. расстройства, не исключающего вменяемости.',
        category: CrimeCategory.Medium,
        sanctions: [restrictY(2, 4), forcedUpToY(5), imprUpToY(5)],
      },
    ],
  },

  {
    number: '107',
    title: 'Убийство в состоянии аффекта',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Убийство в состоянии внезапно возникшего сильного душевного волнения, вызванного насилием/издевательством/тяжким оскорблением.',
        category: CrimeCategory.Small,
        sanctions: [correctUpToY(2), restrictUpToY(3), forcedUpToY(3), imprUpToY(3)],
      },
      {
        part: '2',
        disposition: 'Убийство двух и более лиц в состоянии аффекта.',
        category: CrimeCategory.Medium,
        sanctions: [forcedUpToY(5), imprUpToY(5)],
      },
    ],
  },

  {
    number: '108',
    title: 'Убийство при превышении пределов необходимой обороны / задержания',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Убийство, совершённое при превышении пределов необходимой обороны.',
        category: CrimeCategory.Small,
        sanctions: [correctUpToY(2), restrictUpToY(2), forcedUpToY(2), imprUpToY(2)],
      },
      {
        part: '2',
        disposition:
          'Убийство, совершённое при превышении мер, необходимых для задержания лица, совершившего преступление.',
        category: CrimeCategory.Small,
        sanctions: [restrictUpToY(3), forcedUpToY(3), imprUpToY(3)],
      },
    ],
  },

  {
    number: '109',
    title: 'Причинение смерти по неосторожности',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition: 'Причинение смерти по неосторожности.',
        category: CrimeCategory.Small,
        sanctions: [correctUpToY(2), restrictUpToY(2), forcedUpToY(2), imprUpToY(2)],
      },
      {
        part: '2',
        disposition:
          'Причинение смерти по неосторожности вследствие ненадлежащего исполнения профессиональных обязанностей.',
        category: CrimeCategory.Small,
        sanctions: [restrictUpToY(3), forcedUpToY(3), imprUpToY(3), deprRightAddY(3)],
      },
      {
        part: '3',
        disposition: 'Причинение смерти по неосторожности двум и более лицам.',
        category: CrimeCategory.Medium,
        sanctions: [restrictUpToY(4), forcedUpToY(4), imprUpToY(4), deprRightAddY(3)],
      },
    ],
  },

  {
    number: '110',
    title: 'Доведение до самоубийства',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Доведение лица до самоубийства / покушения на самоубийство путём угроз, жестокого обращения или систематического унижения.',
        category: CrimeCategory.Heavy,
        sanctions: [forcedUpToY(5), imprY(2, 6), deprRightAddY(7)],
      },
      {
        part: '2',
        disposition:
          'То же деяние в отношении несовершеннолетнего/беременной/двух и более лиц; группой; в СМИ или сети «Интернет».',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(8, 15), deprRightAddY(10), restrictAddY(2)],
      },
    ],
  },

  {
    number: '112',
    title: 'Умышленное причинение средней тяжести вреда здоровью',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Умышленное причинение средней тяжести вреда здоровью, не опасного для жизни и не повлёкшего последствий ст. 111, но вызвавшего длит. расстройство здоровья / стойкую утрату трудоспособности < 1/3.',
        category: CrimeCategory.Small,
        sanctions: [restrictUpToY(3), forcedUpToY(3), arrestUpToM(6), imprUpToY(3)],
      },
      {
        part: '2',
        disposition:
          'То же деяние в отношении двух и более лиц; служебного лица; малолетнего; группой; из хулиганских побуждений; по мотивам ненависти.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5), deprRightAddY(3)],
      },
    ],
  },

  {
    number: '115',
    title: 'Умышленное причинение лёгкого вреда здоровью',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Умышленное причинение лёгкого вреда здоровью, вызвавшего кратковременное расстройство / незначительную утрату трудоспособности.',
        category: CrimeCategory.Small,
        sanctions: [fineUpToRub(40_000), mandatoryUpToH(480), correctUpToY(1), arrestUpToM(4)],
      },
      {
        part: '2',
        disposition:
          'То же деяние из хулиганских побуждений; по мотивам ненависти; в отношении служебного лица; с применением оружия / предметов в качестве оружия.',
        category: CrimeCategory.Small,
        sanctions: [
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(6),
          imprUpToY(2),
          deprRightAddY(3),
        ],
      },
    ],
  },

  {
    number: '116',
    title: 'Побои',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Нанесение побоев / иных насильственных действий, причинивших физ. боль (без последствий ст. 115), из хулиганских побуждений / по мотивам ненависти / с публичной демонстрацией.',
        category: CrimeCategory.Small,
        sanctions: [
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(6),
          imprUpToY(2),
          deprRightAddY(3),
        ],
      },
    ],
  },

  {
    number: '116.1',
    title: 'Нанесение побоев лицом, ранее подвергнутым адм. наказанию / судимым',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Нанесение побоев лицом, подвергнутым адм. наказанию по ст. 6.1.1 КоАП, при отсутствии признаков ст. 116.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(40_000),
          mandatoryUpToH(240),
          correctUpToM(6),
          arrestUpToM(3),
        ],
      },
      {
        part: '2',
        disposition:
          'Нанесение побоев лицом, имеющим судимость за преступление, совершённое с применением насилия.',
        category: CrimeCategory.Small,
        sanctions: [
          mandatoryUpToH(480),
          correctUpToY(1),
          restrictUpToY(1),
          arrestUpToM(6),
        ],
      },
    ],
  },

  {
    number: '117',
    title: 'Истязание',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Причинение физических / психических страданий путём систематического нанесения побоев или иными насильственными действиями (без последствий ст. 111, 112).',
        category: CrimeCategory.Small,
        sanctions: [restrictUpToY(3), forcedUpToY(3), imprUpToY(3)],
      },
      {
        part: '2',
        disposition:
          'То же деяние в отношении двух и более лиц; служебного лица; беременной; несовершеннолетнего; с особой жестокостью; группой; по найму; по мотивам ненависти.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(3, 7), deprRightAddY(3)],
      },
    ],
  },

  {
    number: '118',
    title: 'Причинение тяжкого вреда здоровью по неосторожности',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition: 'Причинение тяжкого вреда здоровью по неосторожности.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(80_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          restrictUpToY(3),
          arrestUpToM(6),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние, совершённое вследствие ненадлежащего исполнения профессиональных обязанностей.',
        category: CrimeCategory.Small,
        sanctions: [restrictUpToY(4), forcedUpToY(1), imprUpToY(1), deprRightAddY(3)],
      },
    ],
  },

  {
    number: '119',
    title: 'Угроза убийством или причинением тяжкого вреда здоровью',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Угроза убийством или причинением тяжкого вреда здоровью, если имелись основания опасаться её осуществления.',
        category: CrimeCategory.Small,
        sanctions: [
          mandatoryUpToH(480),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(6),
          imprUpToY(2),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние, совершённое по мотивам ненависти; в отношении служебного лица; с публичной демонстрацией (СМИ / Интернет).',
        category: CrimeCategory.Medium,
        sanctions: [forcedUpToY(5), imprUpToY(5), deprRightAddY(3)],
      },
    ],
  },

  {
    number: '124',
    title: 'Неоказание помощи больному',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Неоказание помощи больному без уважительных причин лицом, обязанным её оказывать, повлёкшее средней тяжести вред здоровью.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(40_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          arrestUpToM(4),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние, повлёкшее по неосторожности смерть больного либо причинение тяжкого вреда здоровью.',
        category: CrimeCategory.Medium,
        sanctions: [forcedUpToY(4), imprUpToY(4), deprRightAddY(3)],
      },
    ],
  },

  {
    number: '125',
    title: 'Оставление в опасности',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Заведомое оставление без помощи лица, находящегося в опасном для жизни или здоровья состоянии и лишённого возможности принять меры к самосохранению, при наличии у виновного обязанности заботиться или поставившего его в такое состояние.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(80_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          forcedUpToY(1),
          arrestUpToM(3),
          imprUpToY(1),
        ],
      },
    ],
  },

  // ── Партия 2: Глава 16 доп., 18 половые, 20 семья, 21 собств., 22 экон. ──

  {
    number: '113',
    title: 'Причинение тяжкого или средней тяжести вреда здоровью в состоянии аффекта',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Умышленное причинение тяжкого или средней тяжести вреда здоровью в состоянии аффекта, вызванном насилием, издевательством, тяжким оскорблением или иными противоправными/аморальными действиями.',
        category: CrimeCategory.Small,
        sanctions: [
          correctUpToY(2),
          restrictUpToY(2),
          forcedUpToY(2),
          imprUpToY(2),
        ],
      },
    ],
  },

  {
    number: '114',
    title: 'Причинение тяжкого или средней тяжести вреда здоровью при превышении необходимой обороны / задержания',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Умышленное причинение тяжкого вреда здоровью при превышении пределов необходимой обороны.',
        category: CrimeCategory.Small,
        sanctions: [
          correctUpToY(1),
          restrictUpToY(1),
          forcedUpToY(1),
          imprUpToY(1),
        ],
      },
      {
        part: '2',
        disposition:
          'Умышленное причинение тяжкого или средней тяжести вреда здоровью при превышении мер, необходимых для задержания лица, совершившего преступление.',
        category: CrimeCategory.Small,
        sanctions: [
          correctUpToY(2),
          restrictUpToY(2),
          forcedUpToY(2),
          imprUpToY(2),
        ],
      },
    ],
  },

  {
    number: '120',
    title: 'Принуждение к изъятию органов или тканей человека для трансплантации',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Принуждение к изъятию органов или тканей человека для трансплантации с применением насилия либо с угрозой его применения.',
        category: CrimeCategory.Medium,
        sanctions: [
          imprUpToY(4),
          deprRightAddY(3),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние в отношении лица, находящегося в беспомощном состоянии либо в материальной/иной зависимости от виновного.',
        category: CrimeCategory.Medium,
        sanctions: [
          imprUpToY(5),
          deprRightAddY(3),
        ],
      },
    ],
  },

  {
    number: '121',
    title: 'Заражение венерической болезнью',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Заражение другого лица венерической болезнью лицом, знавшим о наличии у него этой болезни.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(200_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          arrestUpToM(6),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние в отношении двух и более лиц либо несовершеннолетнего.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(300_000),
          forcedUpToY(5),
          imprUpToY(2),
        ],
      },
    ],
  },

  {
    number: '122',
    title: 'Заражение ВИЧ-инфекцией',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Заведомое поставление другого лица в опасность заражения ВИЧ-инфекцией.',
        category: CrimeCategory.Small,
        sanctions: [
          restrictUpToY(3),
          forcedUpToY(1),
          arrestUpToM(6),
          imprUpToY(1),
        ],
      },
      {
        part: '2',
        disposition:
          'Заражение другого лица ВИЧ-инфекцией лицом, знавшим о наличии у него этой болезни.',
        category: CrimeCategory.Medium,
        sanctions: [
          imprUpToY(5),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяние ч. 2, совершённое в отношении двух и более лиц либо несовершеннолетнего.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(8),
          deprRightAddY(10),
        ],
      },
      {
        part: '4',
        disposition:
          'Заражение ВИЧ-инфекцией вследствие ненадлежащего исполнения профессиональных обязанностей.',
        category: CrimeCategory.Medium,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(5),
          deprRightAddY(3),
        ],
      },
    ],
  },

  {
    number: '123',
    title: 'Незаконное проведение искусственного прерывания беременности',
    chapter: 'Глава 16. Преступления против жизни и здоровья',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Проведение искусственного прерывания беременности лицом, не имеющим высшего медицинского образования соответствующего профиля.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(80_000),
          mandatoryUpToH(480),
          correctUpToY(2),
        ],
      },
      {
        part: '3',
        disposition:
          'То же деяние, повлёкшее по неосторожности смерть потерпевшей либо причинение тяжкого вреда здоровью.',
        category: CrimeCategory.Medium,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(5),
          deprRightAddY(3),
        ],
      },
    ],
  },

  {
    number: '127',
    title: 'Незаконное лишение свободы',
    chapter: 'Глава 17. Преступления против свободы, чести и достоинства личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Незаконное лишение человека свободы, не связанное с его похищением.',
        category: CrimeCategory.Small,
        sanctions: [
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(6),
          imprUpToY(2),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние группой, с применением насилия/оружия, несовершеннолетнего, беременной, двух и более лиц.',
        category: CrimeCategory.Medium,
        sanctions: [
          forcedUpToY(5),
          imprY(3, 5),
          deprRightAddY(3),
        ],
      },
      {
        part: '3',
        disposition:
          'То же деяние организованной группой, повлёкшее смерть или иные тяжкие последствия.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprY(4, 8),
        ],
      },
    ],
  },

  {
    number: '127.1',
    title: 'Торговля людьми',
    chapter: 'Глава 17. Преступления против свободы, чести и достоинства личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Купля-продажа человека, иные сделки в отношении человека, а также совершённые в целях эксплуатации вербовка, перевозка, передача, укрывательство или получение.',
        category: CrimeCategory.Heavy,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(6),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние двух и более лиц, несовершеннолетнего, служебного положения, с насилием, беспомощного, беременной.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprY(3, 10),
          deprRightAddY(15),
          restrictAddY(2),
        ],
      },
      {
        part: '3',
        disposition:
          'То же деяние, повлёкшее смерть, тяжкий вред здоровья, либо совершённое организованной группой.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(8, 15),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '127.2',
    title: 'Использование рабского труда',
    chapter: 'Глава 17. Преступления против свободы, чести и достоинства личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Использование труда человека, в отношении которого осуществляются полномочия, присущие праву собственности, при невозможности отказаться от выполнения работ.',
        category: CrimeCategory.Medium,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(5),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние двух и более лиц, несовершеннолетнего, служебного положения, с насилием/шантажом, уничтожением документов.',
        category: CrimeCategory.Heavy,
        sanctions: [
          forcedUpToY(5),
          imprY(3, 10),
          deprRightAddY(15),
        ],
      },
      {
        part: '3',
        disposition:
          'То же деяние, повлёкшее смерть, тяжкий вред здоровья, либо совершённое организованной группой.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(8, 15),
          restrictAddY(1),
        ],
      },
    ],
  },

  // ── Глава 18 Половая неприкосновенность (партия 2) ────────────────────────

  {
    number: '131',
    title: 'Изнасилование',
    chapter: 'Глава 18. Преступления против половой неприкосновенности и половой свободы личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Изнасилование, то есть половое сношение с применением насилия или с угрозой его применения либо с использованием беспомощного состояния потерпевшей.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(3, 6)],
        isSexualAgainstMinor: true,
      },
      {
        part: '2',
        disposition:
          'Изнасилование группой лиц, с угрозой убийством или тяжким вредом здоровью, либо с особой жестокостью, либо повлёкшее заражение венерическим заболеванием.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(4, 10), restrictAddY(2)],
        isSexualAgainstMinor: true,
      },
      {
        part: '3',
        disposition:
          'Изнасилование несовершеннолетней, либо повлёкшее по неосторожности причинение тяжкого вреда здоровью, заражение ВИЧ-инфекцией или иные тяжкие последствия.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(8, 15), deprRightAddY(20), restrictAddY(2)],
        isSexualAgainstMinor: true,
      },
      {
        part: '4',
        disposition:
          'Изнасилование, повлёкшее по неосторожности смерть потерпевшей, либо потерпевшей, не достигшей четырнадцатилетнего возраста.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(12, 20), deprRightAddY(20), restrictAddY(2)],
        isSexualAgainstMinor: true,
      },
      {
        part: '5',
        disposition:
          'Деяния ч. 3 или ч. 4, совершённые лицом с судимостью за преступление против половой неприкосновенности несовершеннолетнего, либо в отношении двух и более несовершеннолетних, либо сопряжённые с другим тяжким или особо тяжким преступлением.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(15, 20), deprRightAddY(20), lifeImpr()],
        isSexualAgainstMinor: true,
      },
    ],
  },

  {
    number: '132',
    title: 'Насильственные действия сексуального характера',
    chapter: 'Глава 18. Преступления против половой неприкосновенности и половой свободы личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Действия сексуального характера (мужеложство, лесбиянство и др.) с применением насилия или с угрозой его применения либо с использованием беспомощного состояния.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(3, 6)],
        isSexualAgainstMinor: true,
      },
      {
        part: '2',
        disposition:
          'Те же деяния группой лиц, с угрозой убийством или тяжким вредом здоровью, либо с особой жестокостью, либо повлёкшие заражение венерическим заболеванием.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(4, 10), restrictAddY(2)],
        isSexualAgainstMinor: true,
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2 в отношении несовершеннолетнего, либо повлёкшие по неосторожности причинение тяжкого вреда здоровью, заражение ВИЧ-инфекцией или иные тяжкие последствия.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(8, 15), deprRightAddY(20), restrictAddY(2)],
        isSexualAgainstMinor: true,
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-2, повлёкшие по неосторожности смерть потерпевшего, либо в отношении лица, не достигшего четырнадцатилетнего возраста.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(12, 20), deprRightAddY(20), restrictAddY(2)],
        isSexualAgainstMinor: true,
      },
      {
        part: '5',
        disposition:
          'Деяния ч. 3 или ч. 4, совершённые лицом с судимостью за преступление против половой неприкосновенности несовершеннолетнего, либо в отношении двух и более несовершеннолетних, либо сопряжённые с другим тяжким или особо тяжким преступлением.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(15, 20), deprRightAddY(20), lifeImpr()],
        isSexualAgainstMinor: true,
      },
    ],
  },

  {
    number: '133',
    title: 'Понуждение к действиям сексуального характера',
    chapter: 'Глава 18. Преступления против половой неприкосновенности и половой свободы личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Понуждение к половому сношению, мужеложству, лесбиянству или иным действиям сексуального характера путём шантажа, угрозы уничтожением имущества либо с использованием материальной или иной зависимости.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(1),
          imprUpToY(1),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние в отношении несовершеннолетнего.',
        category: CrimeCategory.Medium,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(5),
          deprRightAddY(3),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '3',
        disposition:
          'Деяние ч. 2, совершённое группой лиц, с использованием СМИ/Интернета, либо лицом с судимостью за преступление против половой неприкосновенности несовершеннолетнего.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(6),
          deprRightAddY(10),
        ],
        isSexualAgainstMinor: true,
      },
    ],
  },

  {
    number: '134',
    title: 'Половое сношение и иные действия сексуального характера с лицом, не достигшим 16 лет',
    chapter: 'Глава 18. Преступления против половой неприкосновенности и половой свободы личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Половое сношение с лицом, не достигшим шестнадцатилетнего возраста, лицом, достигшим восемнадцатилетнего возраста.',
        category: CrimeCategory.Medium,
        sanctions: [
          mandatoryUpToH(480),
          restrictUpToY(4),
          forcedUpToY(4),
          imprUpToY(4),
          deprRightAddY(10),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '2',
        disposition:
          'Мужеложство или лесбиянство с лицом, не достигшим шестнадцатилетнего возраста, лицом, достигшим восемнадцатилетнего возраста.',
        category: CrimeCategory.Medium,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(6),
          deprRightAddY(10),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2, совершённые лицом в возрасте 12-14 лет.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprY(3, 10),
          deprRightAddY(15),
          restrictAddY(2),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, совершённые в отношении двух и более лиц.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(8, 15),
          deprRightAddY(20),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '5',
        disposition:
          'Деяния чч. 1-4, совершённые группой лиц, группой лиц по предварительному сговору или организованной группой.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(12, 20),
          deprRightAddY(20),
          restrictAddY(2),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '6',
        disposition:
          'Деяния ч. 3, совершённые лицом с судимостью за преступление против половой неприкосновенности несовершеннолетнего.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(15, 20),
          deprRightAddY(20),
          lifeImpr(),
        ],
        isSexualAgainstMinor: true,
      },
    ],
  },

  {
    number: '135',
    title: 'Развратные действия',
    chapter: 'Глава 18. Преступления против половой неприкосновенности и половой свободы личности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Развратные действия без применения насилия лицом, достигшим восемнадцатилетнего возраста, в отношении лица, не достигшего шестнадцатилетнего возраста.',
        category: CrimeCategory.Small,
        sanctions: [
          mandatoryUpToH(440),
          restrictUpToY(3),
          forcedUpToY(5),
          imprUpToY(3),
          deprRightAddY(10),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '2',
        disposition:
          'То же деяние в отношении лица, достигшего двенадцатилетнего возраста, но не достигшего четырнадцатилетнего возраста.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprY(3, 8),
          deprRightAddY(15),
          restrictAddY(2),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2, совершённые в отношении двух и более лиц.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprY(5, 12),
          deprRightAddY(20),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, совершённые группой лиц, группой лиц по предварительному сговору или организованной группой.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(7, 15),
          deprRightAddY(20),
          restrictAddY(2),
        ],
        isSexualAgainstMinor: true,
      },
      {
        part: '5',
        disposition:
          'Деяния ч. 2, совершённые лицом с судимостью за преступление против половой неприкосновенности несовершеннолетнего.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(10, 15),
          deprRightAddY(20),
        ],
        isSexualAgainstMinor: true,
      },
    ],
  },

  // ── Глава 20 Семья и несовершеннолетние (партия 2) ────────────────────────

  {
    number: '150',
    title: 'Вовлечение несовершеннолетнего в совершение преступления',
    chapter: 'Глава 20. Преступления против семьи и несовершеннолетних',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Вовлечение несовершеннолетнего в совершение преступления путём обещаний, обмана, угроз или иным способом.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
      {
        part: '2',
        disposition:
          'Деяние ч. 1, совершённое родителем, педагогом либо иным лицом, обязанным воспитывать несовершеннолетнего, или с использованием сети Интернет.',
        category: CrimeCategory.Medium,
        sanctions: [imprY(3, 6), deprRightAddY(3)],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2, совершённые с применением насилия или с угрозой, либо в отношении двух и более несовершеннолетних, либо в отношении лица, не достигшего четырнадцатилетнего возраста.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(4, 9), restrictAddY(2), deprRightAddY(3)],
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, связанные с вовлечением несовершеннолетнего в преступную группу, в тяжкое/особо тяжкое преступление, в три и более преступления или по мотивам политической/расовой/религиозной ненависти.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(5, 10), restrictAddY(2)],
      },
    ],
  },

  {
    number: '151',
    title: 'Вовлечение несовершеннолетнего в совершение антиобщественных действий',
    chapter: 'Глава 20. Преступления против семьи и несовершеннолетних',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Вовлечение несовершеннолетнего в систематическое употребление алкоголя, одурманивающих веществ, в занятие бродяжничеством или попрошайничеством.',
        category: CrimeCategory.Medium,
        sanctions: [
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(4),
          arrestUpToM(6),
          imprUpToY(4),
        ],
      },
      {
        part: '2',
        disposition:
          'Деяние ч. 1, совершённое родителем, педагогом либо иным лицом, обязанным воспитывать несовершеннолетнего, или с использованием сети Интернет.',
        category: CrimeCategory.Medium,
        sanctions: [
          restrictY(2, 4),
          arrestUpToM(6),
          imprY(3, 5),
          deprRightAddY(3),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2, совершённые с применением насилия или с угрозой, либо в отношении двух и более несовершеннолетних, либо в отношении лица, не достигшего четырнадцатилетнего возраста.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprY(4, 8),
          restrictAddY(2),
          deprRightAddY(3),
        ],
      },
    ],
  },

  {
    number: '156',
    title: 'Неисполнение обязанностей по воспитанию несовершеннолетнего',
    chapter: 'Глава 20. Преступления против семьи и несовершеннолетних',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Неисполнение или ненадлежащее исполнение обязанностей по воспитанию несовершеннолетнего родителем, педагогом или иным лицом, обязанным надзирать за несовершеннолетним, если это соединено с жестоким обращением.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(100_000),
          mandatoryUpToH(440),
          correctUpToY(2),
          forcedUpToY(3),
          imprUpToY(3),
          deprRightAddY(5),
        ],
      },
    ],
  },

  {
    number: '157',
    title: 'Неуплата средств на содержание детей или нетрудоспособных родителей',
    chapter: 'Глава 20. Преступления против семьи и несовершеннолетних',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Неуплата родителем без уважительных причин в нарушение решения суда или соглашения средств на содержание несовершеннолетних или нетрудоспособных совершеннолетних детей, если это деяние совершено неоднократно.',
        category: CrimeCategory.Small,
        sanctions: [
          correctUpToY(1),
          forcedUpToY(1),
          arrestUpToM(3),
          imprUpToY(1),
        ],
      },
      {
        part: '2',
        disposition:
          'Неуплата совершеннолетним трудоспособным ребёнком без уважительных причин в нарушение решения суда или соглашения средств на содержание нетрудоспособных родителей, если это деяние совершено неоднократно.',
        category: CrimeCategory.Small,
        sanctions: [
          correctUpToY(1),
          forcedUpToY(1),
          arrestUpToM(3),
          imprUpToY(1),
        ],
      },
    ],
  },

  // ── Глава 21 Собственность (партия 2) ───────────────────────────────────

  {
    number: '159',
    title: 'Мошенничество',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Мошенничество, то есть хищение чужого имущества путём обмана или злоупотребления доверием.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(4),
          imprUpToY(2),
        ],
      },
      {
        part: '2',
        disposition:
          'Мошенничество группой по предварительному сговору или с причинением значительного ущерба.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(300_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(5),
          imprUpToY(5),
          restrictAddY(1),
        ],
      },
      {
        part: '3',
        disposition:
          'Мошенничество с использованием служебного положения или в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprUpToY(6),
          fineRub(0, 80_000),
          restrictAddY(1.5),
        ],
      },
      {
        part: '4',
        disposition:
          'Мошенничество организованной группой или в особо крупном размере, либо повлёкшее лишение жилища.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(10),
          fineRub(0, 1_000_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '159.1',
    title: 'Мошенничество в сфере кредитования',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Мошенничество в сфере кредитования путём представления заведомо ложных сведений.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(4),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние, совершённое группой по предварительному сговору.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(300_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(5),
          imprUpToY(4),
          restrictAddY(1),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2 с использованием служебного положения или в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprUpToY(6),
          restrictAddY(1.5),
        ],
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, совершённые организованной группой или в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(10),
          fineRub(0, 1_000_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '159.2',
    title: 'Мошенничество при получении выплат',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Хищение денежных средств при получении пособий, компенсаций, субсидий путём ложных сведений.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(4),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние, совершённое группой по предварительному сговору.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(300_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(5),
          imprUpToY(4),
          restrictAddY(1),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2 с использованием служебного положения или в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprUpToY(6),
          restrictAddY(1.5),
        ],
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, совершённые организованной группой или в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(10),
          fineRub(0, 1_000_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '159.3',
    title: 'Мошенничество с использованием электронных средств платежа',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Мошенничество с использованием электронных средств платежа.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          imprUpToY(3),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние группой по предварительному сговору или с причинением значительного ущерба.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(300_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(5),
          imprUpToY(5),
          restrictAddY(1),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2 с использованием служебного положения или в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprUpToY(6),
          restrictAddY(1.5),
        ],
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, совершённые организованной группой или в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(10),
          fineRub(0, 1_000_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '159.5',
    title: 'Мошенничество в сфере страхования',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Мошенничество в сфере страхования путём обмана относительно страхового случая.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(4),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние группой по предварительному сговору или с причинением значительного ущерба.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(300_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(5),
          imprUpToY(5),
          restrictAddY(1),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2 с использованием служебного положения или в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprUpToY(6),
          restrictAddY(1.5),
        ],
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, совершённые организованной группой или в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(10),
          fineRub(0, 1_000_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '159.6',
    title: 'Мошенничество в сфере компьютерной информации',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Мошенничество в сфере компьютерной информации путём ввода, удаления, блокирования или модификации информации.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          restrictUpToY(2),
          forcedUpToY(2),
          arrestUpToM(4),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние группой по предварительному сговору или с причинением значительного ущерба.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(300_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          forcedUpToY(5),
          imprUpToY(5),
          restrictAddY(1),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2 с использованием служебного положения или в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprUpToY(6),
          restrictAddY(1.5),
        ],
      },
      {
        part: '4',
        disposition:
          'Деяния чч. 1-3, совершённые организованной группой или в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprUpToY(10),
          fineRub(0, 1_000_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '160',
    title: 'Присвоение или растрата',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Присвоение или растрата чужого имущества, вверенного виновному.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(240),
          correctUpToM(6),
          imprUpToY(2),
        ],
      },
    ],
  },

  {
    number: '163',
    title: 'Вымогательство',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Требование передачи чужого имущества под угрозой применения насилия, уничтожения имущества или распространения позорящих сведений.',
        category: CrimeCategory.Medium,
        sanctions: [
          restrictUpToY(4),
          forcedUpToY(4),
          arrestUpToM(6),
          imprUpToY(4),
          fineRub(0, 80_000),
        ],
      },
      {
        part: '2',
        disposition:
          'Вымогательство группой по предварительному сговору, с применением насилия или в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          imprY(0, 7),
          fineRub(0, 500_000),
          restrictAddY(2),
        ],
      },
      {
        part: '3',
        disposition:
          'Вымогательство организованной группой, в целях получения имущества в особо крупном размере или с причинением тяжкого вреда здоровью.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprY(7, 15),
          fineRub(0, 1_000_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '164',
    title: 'Хищение предметов, имеющих особую ценность',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Хищение предметов или документов, имеющих особую историческую, научную, художественную или культурную ценность.',
        category: CrimeCategory.Heavy,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(10),
          fineRub(0, 500_000),
          restrictAddY(1),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние группой по предварительному сговору, организованной группой или повлёкшее уничтожение, порчу или разрушение предметов.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [
          imprUpToY(15),
          fineRub(0, 500_000),
          restrictAddY(2),
        ],
      },
    ],
  },

  {
    number: '166',
    title: 'Неправомерное завладение автомобилем или иным транспортным средством',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Неправомерное завладение автомобилем или иным транспортным средством без цели хищения (угон).',
        category: CrimeCategory.Medium,
        sanctions: [
          fineUpToRub(120_000),
          restrictUpToY(3),
          forcedUpToY(5),
          arrestUpToM(6),
          imprUpToY(5),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние группой по предварительному сговору или с применением насилия, не опасного для жизни/здоровья.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineUpToRub(200_000),
          forcedUpToY(5),
          imprUpToY(7),
        ],
      },
      {
        part: '3',
        disposition:
          'Деяния чч. 1-2, совершённые организованной группой или причинившие особо крупный ущерб.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(10)],
      },
    ],
  },

  {
    number: '167',
    title: 'Умышленное уничтожение или повреждение имущества',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Умышленное уничтожение или повреждение чужого имущества, повлёкшие причинение значительного ущерба.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(40_000),
          mandatoryUpToH(360),
          correctUpToY(1),
          forcedUpToY(2),
          arrestUpToM(3),
          imprUpToY(2),
        ],
      },
      {
        part: '2',
        disposition:
          'Те же деяния из хулиганских побуждений, по мотивам ненависти, путём поджога/взрыва, или повлёкшие смерть человека.',
        category: CrimeCategory.Medium,
        sanctions: [
          forcedUpToY(5),
          imprUpToY(5),
        ],
      },
    ],
  },

  {
    number: '168',
    title: 'Уничтожение или повреждение имущества по неосторожности',
    chapter: 'Глава 21. Преступления против собственности',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Уничтожение или повреждение чужого имущества в крупном размере путём неосторожного обращения с огнём или источниками опасности.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(120_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          imprUpToY(2),
        ],
      },
    ],
  },

  // ── Глава 22 Хозяйственные преступления (партия 2) ─────────────────────

  {
    number: '171',
    title: 'Незаконное предпринимательство',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Осуществление предпринимательской деятельности без регистрации или специального разрешения, если это деяние причинило значительный ущерб.',
        category: CrimeCategory.Small,
        sanctions: [
          fineUpToRub(300_000),
          mandatoryUpToH(480),
          correctUpToY(2),
          imprUpToY(1),
        ],
      },
    ],
  },

  {
    number: '172',
    title: 'Незаконная банковская деятельность',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Осуществление деятельности, связанной с привлечением денежных средств физических и юридических лиц на условиях возврата, без соответствующей лицензии.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprY(2, 6),
        ],
      },
    ],
  },

  {
    number: '174',
    title: 'Легализация (отмывание) денежных средств',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Совершение финансовых операций и иных сделок с денежными средствами или иным имуществом, заведомо полученными преступным путём.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprY(2, 5),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(200_000, 500_000),
          forcedUpToY(5),
          imprY(3, 7),
          restrictAddY(1),
        ],
      },
    ],
  },

  {
    number: '174.1',
    title: 'Легализация (отмывание) денежных средств или иного имущества, полученных в результате совершения преступления, одобренного государством',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Совершение финансовых операций или иных сделок с денежными средствами/имуществом, заведомо полученными преступным путём, одобренным государством.',
        category: CrimeCategory.Medium,
        sanctions: [
          fineRub(100_000, 500_000),
          forcedUpToY(5),
          imprY(2, 5),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние в крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(200_000, 500_000),
          forcedUpToY(5),
          imprY(3, 7),
          restrictAddY(1),
        ],
      },
    ],
  },

  {
    number: '198',
    title: 'Уклонение физического лица от уплаты налогов, сборов',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Уклонение физического лица от уплаты налога или сбора путём непредставления декларации, скрывания источников доходов, создания фиктивных расходов, если это деяние совершено в крупном размере.',
        category: CrimeCategory.Small,
        sanctions: [
          fineRub(100_000, 300_000),
          imprUpToY(2),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(200_000, 500_000),
          imprY(1, 6),
        ],
      },
    ],
  },

  {
    number: '199',
    title: 'Уклонение организации от уплаты налогов, сборов',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Уклонение организацией от уплаты налога или сбора путём непредставления налоговой декларации, скрывания доходов или создания фиктивных расходов, в крупном размере.',
        category: CrimeCategory.Small,
        sanctions: [
          fineRub(100_000, 500_000),
          imprUpToY(2),
        ],
      },
      {
        part: '2',
        disposition:
          'То же деяние в особо крупном размере.',
        category: CrimeCategory.Heavy,
        sanctions: [
          fineRub(200_000, 1_000_000),
          imprY(1, 6),
        ],
      },
    ],
  },

  {
    number: '199.1',
    title: 'Неисполнение обязанностей налогового агента',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Неисполнение налоговым агентом обязанности по удержанию и перечислению налогов в крупном размере.',
        category: CrimeCategory.Small,
        sanctions: [
          fineRub(100_000, 300_000),
          imprUpToY(2),
        ],
      },
    ],
  },

  {
    number: '199.2',
    title: 'Сокрытие денежных средств либо имущества организации',
    chapter: 'Глава 22. Преступления в сфере экономики',
    source: 'core',
    parts: [
      {
        part: '1',
        disposition:
          'Сокрытие денежных средств или иного имущества организацией, за счёт которого должно быть произведено взыскание налогов/сборов, путём их перечисления в иностранные организации или иные действия.',
        category: CrimeCategory.Small,
        sanctions: [
          fineRub(0, 500_000),
          imprUpToY(2),
        ],
      },
    ],
  },

  // ── 205 Террористический акт ─────────────────────────────────────────────
  {
    number: '205',
    title: 'Террористический акт',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Совершение взрыва, поджога или иных действий, создающих опасность гибели людей или причинения значительного имущественного ущерба в целях нарушения общественной безопасности, устрашения населения или оказания воздействия на принятие решений органами власти.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 205.1 Акт терроризма ────────────────────────────────────────────────
  {
    number: '205.1',
    title: 'Акт терроризма',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Действия, совершённые в целях нарушения общественной безопасности, напугания населения или воздействия на органы власти, если они сопряжены с посягательством на жизнь людей или созданием опасности такого посягательства.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 205.2 Совершение взрыва, поджога или иных действий, создающих опасность
  {
    number: '205.2',
    title: 'Совершение взрыва, поджога или иных действий, создающих опасность гибели людей',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Совершение взрыва, поджога или иных действий, создающих опасность гибели людей или причинения значительного имущественного ущерба, если эти действия совершены группой лиц по предварительному сговору или организованной группой, либо повлекли смерть человека, либо причинили значительный ущерб.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 205.3 Финансирование терроризма ──────────────────────────────────────
  {
    number: '205.3',
    title: 'Финансирование терроризма',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Финансирование или иное материальное обеспечение террористической деятельности.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 205.4 Содействие террористической деятельности ───────────────────────
  {
    number: '205.4',
    title: 'Содействие террористической деятельности',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Оказание содействия в планировании, подготовке или совершении террористического акта путём предоставления информации, снабжения оружием, взрывчатыми или иными веществами, или иных действий.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 205.5 Организация террористического сообщества или участие в нём ──────
  {
    number: '205.5',
    title: 'Организация террористического сообщества или участие в нём',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Организация или руководство деятельностью terrористического сообщества.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
      {
        part: '2',
        disposition: 'Участие в деятельности террористического сообщества.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(5, 15)],
      },
    ],
  },

  // ── 206 Захват заложника ────────────────────────────────────────────────
  {
    number: '206',
    title: 'Захват заложника',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Захват или удержание лица в качестве заложника в целях понуждения государства, организации или физического лица совершить какое-либо действие либо воздержаться от его совершения.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 207 Угроза террористическим актом ───────────────────────────────────
  {
    number: '207',
    title: 'Угроза совершением террористического акта',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Угроза совершением взрыва, поджога или иных действий, создающих опасность гибели людей или причинения значительного ущерба, в целях нарушения общественной безопасности или устрашения населения.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 207.3 Публичные призывы к осуществлению террористической деятельности
  {
    number: '207.3',
    title: 'Публичные призывы к осуществлению террористической деятельности',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Публичные призывы к осуществлению террористической деятельности либо публичные призывы к финансированию такой деятельности.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 208 Осуществление деятельности террористической организации ──────────
  {
    number: '208',
    title: 'Осуществление деятельности террористической организации',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Организация, руководство или иное осуществление деятельности общественного объединения или религиозной организации, признанных судом террористическими.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
      {
        part: '2',
        disposition: 'Участие в деятельности такой организации.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(10)],
      },
    ],
  },

  // ── 209 Угроза убийством или причинением тяжкого вреда ──────────────────
  {
    number: '209',
    title: 'Угроза убийством или причинением тяжкого вреда в целях воспрепятствования деятельности должностного лица',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Угроза убийством или причинением тяжкого вреда здоровью в целях воспрепятствования деятельности представителя власти.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 210 Посягательство на жизнь лица, осуществляющего правосудие ────────
  {
    number: '210',
    title: 'Посягательство на жизнь лица, осуществляющего правосудие',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Посягательство на жизнь судьи, присяжного заседателя, прокурора, следователя, дознавателя в целях воспрепятствования деятельности по осуществлению правосудия.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(12, 20), lifeImpr()],
      },
    ],
  },

  // ── 213 Диверсия ─────────────────────────────────────────────────────────
  {
    number: '213',
    title: 'Диверсия',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Совершение взрыва, поджога или иных действий, направленных на разрушение или повреждение предприятий, сооружений, путей сообщения, средств связи в целях подрыва экономической безопасности государства.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(5, 15)],
      },
    ],
  },

  // ── 222 Незаконное приобретение, передача, сбыт, хранение, перевозка или ношение оружия
  {
    number: '222',
    title: 'Незаконное приобретение, передача, сбыт, хранение, перевозка или ношение оружия',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Незаконное приобретение, передача, сбыт, хранение, перевозка или ношение огнестрельного оружия, его основных частей, боеприпасов.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 222.1 Незаконное изготовление оружия ────────────────────────────────
  {
    number: '222.1',
    title: 'Незаконное изготовление оружия',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Незаконное изготовление огнестрельного оружия, его основных частей, боеприпасов.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 223 Неправомерный оборот боевых припасов или взрывчатых веществ ─────
  {
    number: '223',
    title: 'Неправомерный оборот боевых припасов или взрывчатых веществ',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Незаконные приобретение, передача, сбыт, хранение, перевозка или использование боевых припасов, взрывчатых или ядовитых веществ.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 226 Хищение либо вымогательство оружия, боеприпасов, взрывчатых или ядовитых веществ
  {
    number: '226',
    title: 'Хищение либо вымогательство оружия, боеприпасов, взрывчатых или ядовитых веществ',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Хищение (кража, грабёж, разбой) либо вымогательство огнестрельного оружия, боеприпасов, взрывчатых или ядовитых веществ.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(7)],
      },
    ],
  },

  // ── 226.1 Контрабанда сильнодействующих, ядовитых, радиоактивных веществ
  {
    number: '226.1',
    title: 'Контрабанда сильнодействующих, ядовитых, радиоактивных веществ',
    chapter: 'Глава 24. Преступления против безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Контрабанда сильнодействующих, ядовитых, радиоактивных или иных опасных веществ.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(7)],
      },
    ],
  },

  // ── 230 Склонение к потреблению наркотических средств ───────────────────
  {
    number: '230',
    title: 'Склонение к потреблению наркотических средств',
    chapter: 'Глава 25. Преступления против здоровья населения и общественной нравственности',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Склонение лица к потреблению наркотического средства или психотропного вещества без назначения врача путём уговора, обмана, угрозы или иным способом.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 231 Незаконное культивирование растений, содержащих наркотические ────
  {
    number: '231',
    title: 'Незаконное культивирование растений, содержащих наркотические вещества',
    chapter: 'Глава 25. Преступления против здоровья населения и общественной нравственности',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Посадка или культивирование в целях изготовления наркотических средств растений, содержащих наркотические вещества.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 232 Организация или содержание притонов ──────────────────────────────
  {
    number: '232',
    title: 'Организация или содержание притонов для потребления наркотических средств',
    chapter: 'Глава 25. Преступления против здоровья населения и общественной нравственности',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Организация или содержание притонов для потребления наркотических средств или психотропных веществ.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 234 Незаконный оборот сильнодействующих или ядовитых веществ ────────
  {
    number: '234',
    title: 'Незаконный оборот сильнодействующих или ядовитых веществ',
    chapter: 'Глава 25. Преступления против здоровья населения и общественной нравственности',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Незаконные приобретение, хранение, перевозка, передача или сбыт сильнодействующих или ядовитых веществ.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 238 Эпидемиологическое преступление ─────────────────────────────────
  {
    number: '238',
    title: 'Эпидемиологическое преступление',
    chapter: 'Глава 25. Преступления против здоровья населения и общественной нравственности',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Создание угрозы распространения эпидемии путём нарушения санитарно-эпидемиологических правил либо умышленного заражения другого лица.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 275 Государственная измена ───────────────────────────────────────────
  {
    number: '275',
    title: 'Государственная измена',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Передача государственной тайны иностранному государству, международной организации или их представителям, выдача таких сведений или иные действия, направленные на подрыв безопасности государства.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(12, 20), lifeImpr()],
      },
    ],
  },

  // ── 276 Шпионаж ──────────────────────────────────────────────────────────
  {
    number: '276',
    title: 'Шпионаж',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Передача иностранному государству, международной организации или их представителям сведений, составляющих государственную тайну, в целях использования их против России.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(8, 20)],
      },
    ],
  },

  // ── 277 Посягательство на жизнь государственного или общественного деятеля
  {
    number: '277',
    title: 'Посягательство на жизнь государственного или общественного деятеля',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Посягательство на жизнь государственного деятеля или общественного деятеля в целях прекращения его государственной или общественной деятельности либо из мести за такую деятельность.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 278 Посягательство на жизнь работников правоохранительного органа ────
  {
    number: '278',
    title: 'Посягательство на жизнь работников правоохранительного органа',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Посягательство на жизнь сотрудника правоохранительного органа в целях воспрепятствования его деятельности или из мести за неё.',
        category: CrimeCategory.EspeciallyHeavy,
        sanctions: [imprY(3, 20), restrictAddY(1)],
        isTerrorism: true,
      },
    ],
  },

  // ── 280 Пропаганда национальной, расовой или религиозной вражды ─────────
  {
    number: '280',
    title: 'Пропаганда национальной, расовой или религиозной вражды',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Пропаганда и агитация, направленные на разжигание национальной, расовой или религиозной вражды и ненависти.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(2)],
      },
    ],
  },

  // ── 280.1 Организация деятельности экстремистской организации ────────────
  {
    number: '280.1',
    title: 'Организация деятельности экстремистской организации',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Организация, руководство или иное осуществление деятельности общественного объединения или организации, признанных судом экстремистскими.',
        category: CrimeCategory.Heavy,
        sanctions: [imprY(3, 14)],
      },
    ],
  },

  // ── 282 Возбуждение ненависти либо вражды ────────────────────────────────
  {
    number: '282',
    title: 'Возбуждение ненависти либо вражды, унижение человеческого достоинства',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Действия, направленные на возбуждение ненависти либо вражды, а равно унижение человеческого достоинства по признакам социальной, расовой, национальной, религиозной или языковой принадлежности.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(2)],
      },
    ],
  },

  // ── 282.1 Использование сети Интернет для возбуждения вражды ────────────
  {
    number: '282.1',
    title: 'Использование сети Интернет для возбуждения вражды',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Использование сети Интернет или иных средств массовой информации для возбуждения ненависти либо вражды по признакам социальной, расовой, национальной, религиозной или языковой принадлежности.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(2)],
      },
    ],
  },

  // ── 282.2 Организация деятельности организаций, признанных экстремистскими
  {
    number: '282.2',
    title: 'Организация деятельности организаций, признанных экстремистскими',
    chapter: 'Глава 29. Преступления против основ конституционного строя и безопасности государства',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Финансирование экстремистской деятельности либо предоставление имущества в целях её финансирования.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(2)],
      },
    ],
  },

  // ── 285 Злоупотребление должностными полномочиями ───────────────────────
  {
    number: '285',
    title: 'Злоупотребление должностными полномочиями',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Использование должностным лицом своих служебных полномочий вопреки интересам государственной службы, совершённое из корыстной или личной заинтересованности.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(4)],
      },
    ],
  },

  // ── 286 Превышение должностных полномочий ──────────────────────────────
  {
    number: '286',
    title: 'Превышение должностных полномочий',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Совершение должностным лицом действий, явно выходящих за пределы его полномочий и повлёкших существенный вред правам и интересам граждан.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 290 Получение взятки ───────────────────────────────────────────────
  {
    number: '290',
    title: 'Получение взятки',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Получение взятки (денег, ценных бумаг, иного имущества или услуг имущественного характера) должностным лицом за совершение действий в пределах или вопреки пределам его полномочий.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 291 Дача взятки ────────────────────────────────────────────────────
  {
    number: '291',
    title: 'Дача взятки',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Дача взятки должностному лицу или его близким в целях побуждения его совершить действия в пределах или вопреки пределам полномочий.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 291.1 Дача взятки лицу, выполняющему управленческие функции ─────────
  {
    number: '291.1',
    title: 'Дача взятки лицу, выполняющему управленческие функции',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Дача взятки лицу, выполняющему управленческие функции в коммерческой или иной организации, за совершение действий в пределах или вопреки пределам его полномочий.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(2)],
      },
    ],
  },

  // ── 291.2 Посредничество во взяточничестве ──────────────────────────────
  {
    number: '291.2',
    title: 'Посредничество во взяточничестве',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Посредничество во взяточничестве, то есть действия по передаче взятки или участие в её передаче либо в организации передачи взятки.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 292 Коммерческий подкуп ────────────────────────────────────────────
  {
    number: '292',
    title: 'Коммерческий подкуп',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Дача имущественного вознаграждения лицу, выполняющему управленческие функции в коммерческой организации, за совершение им действий в пределах или вопреки пределам его полномочий.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 293 Получение подарка в целях совершения коммерческого подкупа ──────
  {
    number: '293',
    title: 'Получение подарка в целях совершения коммерческого подкупа',
    chapter: 'Глава 30. Преступления против государственной власти, интересов государственной службы и службы в органах местного самоуправления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Получение подарков или иного вознаграждения лицом, выполняющим управленческие функции в коммерческой организации, за совершение им действий в пределах или вопреки пределам полномочий.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(2)],
      },
    ],
  },

  // ── 305 Вынесение судьей заведомо несправедливого приговора ────────────
  {
    number: '305',
    title: 'Вынесение судьей заведомо несправедливого приговора или решения',
    chapter: 'Глава 31. Преступления против правосудия',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Вынесение судьёй приговора или решения в гражданском деле, заведомо несоответствующих обстоятельствам дела, при отсутствии признаков преступления, предусмотренного статьей 305 по другим основаниям.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(4)],
      },
    ],
  },

  // ── 306 Вынесение заведомо ненаказуемого приговора ──────────────────────
  {
    number: '306',
    title: 'Вынесение заведомо ненаказуемого приговора',
    chapter: 'Глава 31. Преступления против правосудия',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Вынесение судьёй заведомо ненаказуемого приговора либо применение ненаказуемого наказания.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 307 Провокация взятки или коммерческого подкупа ──────────────────────
  {
    number: '307',
    title: 'Провокация взятки или коммерческого подкупа',
    chapter: 'Глава 31. Преступления против правосудия',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Проведение лицом специального оперативной деятельности по провокации взятки или коммерческого подкупа с целью изобличения должностного лица или лица, выполняющего управленческие функции.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(3)],
      },
    ],
  },

  // ── 308 Отказ свидетеля от дачи показаний ──────────────────────────────
  {
    number: '308',
    title: 'Отказ свидетеля от дачи показаний',
    chapter: 'Глава 31. Преступления против правосудия',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Отказ свидетеля, потерпевшего, эксперта или переводчика явиться по вызову в суд или дать показания.',
        category: CrimeCategory.Small,
        sanctions: [fineUpToRub(50_000)],
      },
    ],
  },

  // ── 309 Давление на свидетеля или потерпевшего ──────────────────────────
  {
    number: '309',
    title: 'Давление на свидетеля, потерпевшего, эксперта, переводчика',
    chapter: 'Глава 31. Преступления против правосудия',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Применение насилия, угроза, порча имущества или иные неправомерные действия в целях воспрепятствования свидетелю, потерпевшему дать показания.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(4)],
      },
    ],
  },

  // ── 319 Оскорбление представителя власти ────────────────────────────────
  {
    number: '319',
    title: 'Оскорбление представителя власти',
    chapter: 'Глава 32. Преступления против порядка управления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Публичное оскорбление представителя власти при исполнении им служебных обязанностей или в связи с их исполнением.',
        category: CrimeCategory.Small,
        sanctions: [imprUpToY(1)],
      },
    ],
  },

  // ── 322 Незаконное пересечение государственной границы ─────────────────
  {
    number: '322',
    title: 'Незаконное пересечение государственной границы',
    chapter: 'Глава 32. Преступления против порядка управления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Пересечение государственной границы без надлежащего разрешения.',
        category: CrimeCategory.Small,
        sanctions: [fineUpToRub(200_000), imprUpToY(2)],
      },
    ],
  },

  // ── 322.1 Организация незаконной миграции ──────────────────────────────
  {
    number: '322.1',
    title: 'Организация незаконной миграции',
    chapter: 'Глава 32. Преступления против порядка управления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Организация незаконного въезда иностранных граждан в Россию или незаконного пребывания на её территории.',
        category: CrimeCategory.Medium,
        sanctions: [imprY(2, 5)],
      },
    ],
  },

  // ── 327 Подделка документов ────────────────────────────────────────────
  {
    number: '327',
    title: 'Подделка, изготовление или оборот поддельных документов',
    chapter: 'Глава 32. Преступления против порядка управления',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Подделка официального документа, предоставляющего права или освобождающего от обязанностей, в целях его использования.',
        category: CrimeCategory.Small,
        sanctions: [restrictUpToY(2), imprUpToY(2)],
      },
    ],
  },

  // ── 337 Самовольное оставление части или места службы ──────────────────
  {
    number: '337',
    title: 'Самовольное оставление части или места службы',
    chapter: 'Глава 33. Преступления против военной службы',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Самовольное оставление части или места службы продолжительностью свыше двух суток, но не более десяти суток.',
        category: CrimeCategory.Small,
        sanctions: [arrestUpToM(6)],
      },
      {
        part: '3',
        disposition: 'Самовольное оставление продолжительностью свыше десяти суток, но не более одного месяца.',
        category: CrimeCategory.Small,
        sanctions: [restrictUpToY(2), imprUpToY(3)],
      },
      {
        part: '4',
        disposition: 'Самовольное оставление продолжительностью свыше одного месяца.',
        category: CrimeCategory.Medium,
        sanctions: [imprUpToY(5)],
      },
    ],
  },

  // ── 338 Дезертирство ──────────────────────────────────────────────────
  {
    number: '338',
    title: 'Дезертирство',
    chapter: 'Глава 33. Преступления против военной службы',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Дезертирство, то есть самовольное оставление части с целью уклонения от военной службы.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(7)],
      },
      {
        part: '2',
        disposition: 'Дезертирство с оружием или группой лиц.',
        category: CrimeCategory.Heavy,
        sanctions: [imprUpToY(10)],
      },
    ],
  },

  // ── 354.1 Реабилитация нацизма ────────────────────────────────────────
  {
    number: '354.1',
    title: 'Реабилитация нацизма',
    chapter: 'Глава 34. Преступления против мира и безопасности человечества',
    source: 'user',
    parts: [
      {
        part: '1',
        disposition: 'Отрицание фактов, установленных Международным военным трибуналом, одобрение преступлений нацизма, отрицание геноцида советского народа или его одобрение, распространение ложных сведений о деятельности СССР в Великой Отечественной войне, публично.',
        category: CrimeCategory.Small,
        sanctions: [fineRub(0, 3_000_000), imprUpToY(3)],
      },
      {
        part: '2',
        disposition: 'То же с использованием служебного положения, группой, средств массовой информации или интернета.',
        category: CrimeCategory.Medium,
        sanctions: [fineRub(2_000_000, 5_000_000), imprUpToY(5)],
      },
    ],
  },
];
