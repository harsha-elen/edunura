import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum QuizQuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',
    TRUE_FALSE = 'true_false',
    SHORT_ANSWER = 'short_answer',
}

interface QuizQuestionAttributes {
    id: number;
    lesson_id: number;
    question_text: string;
    question_type: QuizQuestionType;
    correct_answer: string;
    explanation?: string;
    order: number;
    created_at?: Date;
    updated_at?: Date;
}

interface QuizQuestionCreationAttributes extends Optional<QuizQuestionAttributes, 'id' | 'explanation' | 'order' | 'created_at' | 'updated_at'> {}

class QuizQuestion extends Model<QuizQuestionAttributes, QuizQuestionCreationAttributes> implements QuizQuestionAttributes {
    public id!: number;
    public lesson_id!: number;
    public question_text!: string;
    public question_type!: QuizQuestionType;
    public correct_answer!: string;
    public explanation?: string;
    public order!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

QuizQuestion.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        lesson_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'lessons',
                key: 'id',
            },
        },
        question_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        question_type: {
            type: DataTypes.ENUM(...Object.values(QuizQuestionType)),
            allowNull: false,
        },
        correct_answer: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        explanation: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'quiz_questions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default QuizQuestion;
