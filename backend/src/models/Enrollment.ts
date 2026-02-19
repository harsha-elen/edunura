import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum EnrollmentStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    SUSPENDED = 'suspended',
}

interface EnrollmentAttributes {
    id: number;
    course_id: number;
    student_id: number;
    status: EnrollmentStatus;
    enrollment_date: Date;
    completion_date?: Date;
    progress_percentage: number;
    created_at?: Date;
    updated_at?: Date;
}

interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'enrollment_date' | 'completion_date' | 'progress_percentage' | 'created_at' | 'updated_at'> {}

class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
    public id!: number;
    public course_id!: number;
    public student_id!: number;
    public status!: EnrollmentStatus;
    public enrollment_date!: Date;
    public completion_date?: Date;
    public progress_percentage!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Enrollment.init(
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
        status: {
            type: DataTypes.ENUM(...Object.values(EnrollmentStatus)),
            defaultValue: EnrollmentStatus.ACTIVE,
            allowNull: false,
        },
        enrollment_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        completion_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        progress_percentage: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            validate: {
                min: 0,
                max: 100,
            },
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
        tableName: 'enrollments',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['course_id', 'student_id'],
                name: 'unique_enrollment',
            },
        ],
    }
);

export default Enrollment;
