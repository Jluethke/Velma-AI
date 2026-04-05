# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""
Solopreneur Engine — tell me your idea, get a running business back.

Usage::

    from skillchain.tools.solopreneur import SolopreneurEngine

    engine = SolopreneurEngine()
    result = engine.run(
        idea="AI invoice processing for freelancers",
        target_audience="freelancers doing $50K-200K/year with 10+ clients",
        founder_skills=["python", "ML", "freelancing"],
        budget="$500/month",
    )
    print(result.report)
"""

from .engine import LaunchResult, SolopreneurEngine

__all__ = ["SolopreneurEngine", "LaunchResult"]
