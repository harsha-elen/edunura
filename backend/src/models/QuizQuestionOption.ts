import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface QuizQuestionOptionAttributes {
    id: number;
    question_id: number;
    option_text: string;
    option_order: number;
    created_at?: Date;
    updated_at?: Date;
}

interface QuizQuestionOptionCreationAttributes extends Optional<QuizQuestionOptionAttributes, 'id' | 'option_order' | 'created_at' | 'updated_at'> {}

class QuizQuestionOption extends Model<QuizQuestionOptionAttributes, QuizQuestionOptionCreationAttributes> implements QuizQuestionOptionAttributes {
    public id!: number;
    public question_id!: number;
    public option_text!: string;
    public option_order!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

QuizQuestionOption.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        question_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'quiz_questions',
                key: 'id',
            },
        },
        option_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        option_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'quiz_question_options',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default QuizQuestionOption;
