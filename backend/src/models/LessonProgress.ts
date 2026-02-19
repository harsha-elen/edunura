import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LessonProgressAttributes {
    id: number;
    course_id: number;
    student_id: number;
    lesson_id: number;
    completed: boolean;
    completed_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

interface LessonProgressCreationAttributes extends Optional<LessonProgressAttributes, 'id' | 'completed_at' | 'created_at' | 'updated_at'> {}

class LessonProgress extends Model<LessonProgressAttributes, LessonProgressCreationAttributes> implements LessonProgressAttributes {
    public id!: number;
    public course_id!: number;
    public student_id!: number;
    public lesson_id!: number;
    public completed!: boolean;
    public completed_at?: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

LessonProgress.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        course_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'courses',
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
        lesson_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'lessons',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
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
        tableName: 'lesson_progress',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['course_id', 'student_id', 'lesson_id'],
                name: 'unique_lesson_progress',
            },
        ],
    }
);

export default LessonProgress;
