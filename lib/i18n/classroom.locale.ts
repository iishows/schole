export const classroomCN = {
  classroom: {
    period: {
      beforeClass: '预备中',
      lesson: '第 {{n}} 节 · {{label}}',
      break: '🔔 课间',
      afterClass: '放学啦',
    },
    handRaise: {
      btnLabel: '举手',
      inputPlaceholder: '你想问什么？',
      submit: '举手',
      badgeLabel: '{{n}} 人举手',
    },
    callOn: {
      title: '请回答',
      countdownPrefix: '准备',
      fallbackToast: '{{name}} 没接上，老师请下一位',
    },
    passNote: {
      rejectedToast: '纸条只能给邻桌',
      bubblePrefix: '收到纸条',
    },
    blackboard: {
      tabSlide: '📑 幻灯片',
      tabBlackboard: '📝 白板',
      strokeLimit: '黑板快满了，擦一擦再写',
    },
  },
} as const;

export const classroomINTL = {
  classroom: {
    period: {
      beforeClass: 'Homeroom opens soon',
      lesson: 'Lesson {{n}} · {{label}}',
      break: '🔔 Circle time',
      afterClass: "School's out",
    },
    handRaise: {
      btnLabel: 'Raise hand',
      inputPlaceholder: 'What do you want to ask?',
      submit: 'Raise hand',
      badgeLabel: '{{n}} hand(s) up',
    },
    callOn: {
      title: 'Your turn',
      countdownPrefix: 'Get ready',
      fallbackToast: "{{name}} didn't answer — homeroom teacher, please pick another",
    },
    passNote: {
      rejectedToast: 'Notes can only go to a deskmate',
      bubblePrefix: 'Note received',
    },
    blackboard: {
      tabSlide: '📑 Slides',
      tabBlackboard: '📝 Whiteboard',
      strokeLimit: 'Whiteboard is full — please erase before drawing more',
    },
  },
} as const;
