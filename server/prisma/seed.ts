import { PrismaClient, Role, FeedbackType, EnrollmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "senha123";

async function main() {
  console.log("Limpando banco...");
  await prisma.moduleProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.trackSkill.deleteMany();
  await prisma.trackModule.deleteMany();
  await prisma.learningTrack.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log("Criando usuários...");
  const hr = await prisma.user.create({
    data: {
      name: "Renata Souza",
      email: "rh@empresa.com",
      passwordHash,
      role: Role.HR,
      title: "Analista de Pessoas & Desenvolvimento",
    },
  });

  const managerA = await prisma.user.create({
    data: {
      name: "Carlos Mendes",
      email: "carlos.gestor@empresa.com",
      passwordHash,
      role: Role.MANAGER,
      title: "Gerente de Engenharia",
    },
  });

  const managerB = await prisma.user.create({
    data: {
      name: "Fernanda Lima",
      email: "fernanda.gestor@empresa.com",
      passwordHash,
      role: Role.MANAGER,
      title: "Gerente Comercial",
    },
  });

  const employees = await Promise.all(
    [
      { name: "Ana Paula Rocha", email: "ana.rocha@empresa.com", title: "Engenheira de Software Pleno", managerId: managerA.id },
      { name: "Bruno Alves", email: "bruno.alves@empresa.com", title: "Engenheiro de Software Júnior", managerId: managerA.id },
      { name: "Camila Torres", email: "camila.torres@empresa.com", title: "Engenheira de Dados", managerId: managerA.id },
      { name: "Diego Ferreira", email: "diego.ferreira@empresa.com", title: "Executivo de Contas", managerId: managerB.id },
      { name: "Elisa Martins", email: "elisa.martins@empresa.com", title: "SDR", managerId: managerB.id },
      { name: "Felipe Costa", email: "felipe.costa@empresa.com", title: "Analista Comercial", managerId: managerB.id },
    ].map((e) => prisma.user.create({ data: { ...e, passwordHash, role: Role.EMPLOYEE } }))
  );

  console.log("Criando trilhas de aprendizagem...");
  const tracksData = [
    {
      title: "Fundamentos de Liderança",
      description: "Desenvolva as competências essenciais para liderar pessoas e times com confiança.",
      category: "Liderança",
      level: "Intermediário",
      skills: ["Liderança", "Comunicação", "Gestão de Conflitos"],
      modules: [
        { title: "O que faz um líder eficaz", durationMinutes: 30 },
        { title: "Delegação e autonomia", durationMinutes: 25 },
        { title: "Feedback como ferramenta de desenvolvimento", durationMinutes: 40 },
        { title: "Gestão de conflitos no time", durationMinutes: 35 },
      ],
    },
    {
      title: "Comunicação Assertiva",
      description: "Aprenda técnicas para se comunicar com clareza, empatia e impacto no dia a dia de trabalho.",
      category: "Comportamental",
      level: "Básico",
      skills: ["Comunicação", "Inteligência Emocional"],
      modules: [
        { title: "Os pilares da comunicação assertiva", durationMinutes: 20 },
        { title: "Escuta ativa", durationMinutes: 25 },
        { title: "Comunicação não-violenta no trabalho", durationMinutes: 30 },
      ],
    },
    {
      title: "Fundamentos de Dados para Não-Analistas",
      description: "Entenda conceitos de dados, métricas e indicadores para tomar decisões melhores.",
      category: "Dados",
      level: "Básico",
      skills: ["Dados", "Pensamento Analítico"],
      modules: [
        { title: "Por que dados importam", durationMinutes: 20 },
        { title: "Lendo dashboards e métricas", durationMinutes: 30 },
        { title: "Definindo bons indicadores (KPIs)", durationMinutes: 25 },
      ],
    },
    {
      title: "Engenharia de Software: Boas Práticas",
      description: "Padrões de código, revisão e arquitetura para elevar a qualidade das entregas técnicas.",
      category: "Técnico",
      level: "Avançado",
      skills: ["Engenharia de Software", "Arquitetura"],
      modules: [
        { title: "Clean Code na prática", durationMinutes: 45 },
        { title: "Como fazer boas revisões de código", durationMinutes: 30 },
        { title: "Princípios de arquitetura escalável", durationMinutes: 50 },
      ],
    },
    {
      title: "Técnicas de Negociação e Vendas Consultivas",
      description: "Fundamentos para conduzir negociações e vendas com foco em valor para o cliente.",
      category: "Comercial",
      level: "Intermediário",
      skills: ["Vendas", "Negociação", "Comunicação"],
      modules: [
        { title: "Mapeando as necessidades do cliente", durationMinutes: 25 },
        { title: "Construindo propostas de valor", durationMinutes: 30 },
        { title: "Técnicas de fechamento e objeções", durationMinutes: 35 },
      ],
    },
    {
      title: "Gestão do Tempo e Produtividade",
      description: "Métodos práticos para priorizar tarefas e manter o foco em um dia de trabalho cheio de demandas.",
      category: "Comportamental",
      level: "Básico",
      skills: ["Produtividade", "Organização"],
      modules: [
        { title: "Priorização com a matriz de Eisenhower", durationMinutes: 20 },
        { title: "Gerenciando interrupções", durationMinutes: 15 },
        { title: "Blocos de foco e deep work", durationMinutes: 25 },
      ],
    },
  ];

  const tracks = [];
  for (const t of tracksData) {
    const { skills, modules, ...rest } = t;
    const track = await prisma.learningTrack.create({
      data: {
        ...rest,
        modules: { create: modules.map((m, idx) => ({ ...m, order: idx + 1 })) },
        skills: {
          create: await Promise.all(
            skills.map(async (name) => {
              const skill = await prisma.skill.upsert({
                where: { name },
                update: {},
                create: { name },
              });
              return { skillId: skill.id };
            })
          ),
        },
      },
      include: { modules: true },
    });
    tracks.push(track);
  }

  console.log("Criando inscrições e progresso de exemplo...");
  const [lideranca, comunicacao, dados, engenharia, vendas, produtividade] = tracks;

  const [ana, bruno, camila, diego, elisa, felipe] = employees;

  async function enroll(userId: string, track: (typeof tracks)[number], completedModules: number) {
    const enrollment = await prisma.enrollment.create({
      data: { userId, trackId: track.id, status: EnrollmentStatus.IN_PROGRESS },
    });
    const total = track.modules.length;
    for (let i = 0; i < completedModules && i < total; i++) {
      await prisma.moduleProgress.create({
        data: { enrollmentId: enrollment.id, moduleId: track.modules[i].id, completed: true, completedAt: new Date() },
      });
    }
    const progressPercent = total > 0 ? Math.round((completedModules / total) * 100) : 0;
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent,
        status:
          progressPercent === 100
            ? EnrollmentStatus.COMPLETED
            : progressPercent > 0
            ? EnrollmentStatus.IN_PROGRESS
            : EnrollmentStatus.NOT_STARTED,
        completedAt: progressPercent === 100 ? new Date() : null,
      },
    });
  }

  await enroll(ana.id, engenharia, 3);
  await enroll(ana.id, comunicacao, 3);
  await enroll(bruno.id, engenharia, 1);
  await enroll(bruno.id, produtividade, 0);
  await enroll(camila.id, dados, 3);
  await enroll(diego.id, vendas, 2);
  await enroll(elisa.id, vendas, 3);
  await enroll(elisa.id, comunicacao, 1);
  await enroll(felipe.id, produtividade, 3);
  await enroll(managerA.id, lideranca, 4);
  await enroll(managerB.id, lideranca, 2);

  console.log("Criando feedbacks de exemplo...");
  await prisma.feedback.createMany({
    data: [
      {
        fromUserId: managerA.id,
        toUserId: ana.id,
        type: FeedbackType.PRAISE,
        message: "Excelente condução da entrega do último sprint, muita clareza na comunicação com o time.",
      },
      {
        fromUserId: managerA.id,
        toUserId: bruno.id,
        type: FeedbackType.CONSTRUCTIVE,
        message: "Capriche mais na cobertura de testes antes de abrir o PR, isso vai acelerar as revisões.",
        actionItems: "Adicionar testes unitários nos próximos 2 PRs e revisar com o time de QA.",
      },
      {
        fromUserId: managerA.id,
        toUserId: camila.id,
        type: FeedbackType.CHECKIN,
        message: "1:1 mensal: alinhamos prioridades do trimestre e evolução na trilha de dados.",
        actionItems: "Concluir a trilha de Fundamentos de Dados até o fim do mês.",
      },
      {
        fromUserId: ana.id,
        toUserId: bruno.id,
        type: FeedbackType.PRAISE,
        message: "Valeu pela ajuda na investigação daquele bug complicado ontem!",
      },
      {
        fromUserId: managerB.id,
        toUserId: elisa.id,
        type: FeedbackType.PRAISE,
        message: "Ótimo resultado de prospecção este mês, acima da meta.",
      },
      {
        fromUserId: managerB.id,
        toUserId: diego.id,
        type: FeedbackType.CHECKIN,
        message: "1:1 mensal: discutimos plano de carreira e trilha de negociação.",
        actionItems: "Concluir trilha de Técnicas de Negociação até o próximo ciclo.",
      },
    ],
  });

  console.log("Seed concluído.");
  console.log("---");
  console.log("Usuários de teste (senha para todos: " + DEFAULT_PASSWORD + "):");
  console.log("RH:       rh@empresa.com");
  console.log("Gestor:   carlos.gestor@empresa.com / fernanda.gestor@empresa.com");
  console.log("Colab.:   ana.rocha@empresa.com, bruno.alves@empresa.com, camila.torres@empresa.com,");
  console.log("          diego.ferreira@empresa.com, elisa.martins@empresa.com, felipe.costa@empresa.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
