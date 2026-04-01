import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface QuizAttemptAttributes {
    id: number;
    lesson_id: number;
    student_id: number;
    answers: Record<string, string>;
    results: Array<{
        question_id: number;
        status: 'correct' | 'wrong' | 'review';
        correct_answer?: string;
        explanation?: string | null;
    }>;
    total_questions: number;
    correct_count: number;
    wrong_count: number;
    review_count: number;
    submitted_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface QuizAttemptCreationAttributes extends Optional<
    QuizAttemptAttributes,
    'id' | 'created_at' | 'updated_at'
> {}

class QuizAttempt
    extends Model<QuizAttemptAttributes, QuizAttemptCreationAttributes>
    implements QuizAttemptAttributes
{
    public id!: number;
    public lesson_id!: number;
    public student_id!: number;
    public answers!: Record<string, string>;
    public results!: Array<{
        question_id: number;
        status: 'correct' | 'wrong' | 'review';
        correct_answer?: string;
        explanation?: string | null;
    }>;
    public total_questions!: number;
    public correct_count!: number;
    public wrong_count!: number;
    public review_count!: number;
    public submitted_at!: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

QuizAttempt.init(
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
            onDelete: 'CASCADE',
        },
        student_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        answers: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        results: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        total_questions: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        correct_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        wrong_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        review_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'quiz_attempts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['lesson_id', 'student_id'],
                name: 'unique_quiz_attempt_per_student',
            },
        ],
    }
);

export default QuizAttempt;
